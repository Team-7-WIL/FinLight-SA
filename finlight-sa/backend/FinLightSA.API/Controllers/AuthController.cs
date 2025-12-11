using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Auth;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.Infrastructure.Services;
using BCrypt.Net;
using System.Security.Claims;
using Google;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    private void LogAuditAction(string action, string module, Guid userId, Guid businessId, Guid? recordId = null, string? details = null)
    {
        var auditLog = new AuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BusinessId = businessId,
            Action = action,
            Module = module,
            RecordId = recordId,
            Details = details,
            Timestamp = DateTime.UtcNow
        };

        _context.AuditLogs.Add(auditLog);
        _context.SaveChangesAsync();
    }

    public AuthController(
        ApplicationDbContext context,
        JwtService jwtService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
    }

    private Guid GetBusinessId()
    {
        var businessIdClaim = User.FindFirst("BusinessId")?.Value;
        return Guid.Parse(businessIdClaim!);
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if user exists
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "User with this email already exists",
                    Errors = new List<string> { "Email already registered" }
                });
            }

            // Create user
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);

            // Create default business
            var business = new Business
            {
                Id = Guid.NewGuid(),
                Name = request.BusinessName,
                Industry = request.Industry,
                CreatedAt = DateTime.UtcNow
            };

            _context.Businesses.Add(business);

            // Link user to business as Owner
            var userBusinessRole = new UserBusinessRole
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                BusinessId = business.Id,
                Role = "Owner",
                CreatedAt = DateTime.UtcNow
            };

            _context.UserBusinessRoles.Add(userBusinessRole);

            await _context.SaveChangesAsync();

            // Generate JWT token
            var tokenResponse = _jwtService.GenerateToken(user, business.Id, "Owner");

            var response = new AuthResponse
            {
                AccessToken = tokenResponse.AccessToken,
                RefreshToken = tokenResponse.RefreshToken,
                ExpiresIn = tokenResponse.ExpiresIn,
                TokenType = tokenResponse.TokenType,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Businesses = new List<BusinessRoleDto>
                    {
                        new BusinessRoleDto
                        {
                            BusinessId = business.Id,
                            BusinessName = business.Name,
                            Role = "Owner"
                        }
                    }
                },
                DefaultBusiness = new FinLightSA.Core.DTOs.Business.BusinessDto
                {
                    Id = business.Id,
                    Name = business.Name,
                    Industry = business.Industry,
                    SubscriptionPlan = business.SubscriptionPlan,
                    CreatedAt = business.CreatedAt
                }
            };

            // Log successful registration
            LogAuditAction("REGISTER", "AUTHENTICATION", user.Id, business.Id, user.Id, $"User {user.Email} registered successfully for business {business.Name}");

            return Ok(new ApiResponse<AuthResponse>
            {
                Success = true,
                Message = "Registration successful",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, new ApiResponse<AuthResponse>
            {
                Success = false,
                Message = "An error occurred during registration",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        try
        {
            _logger.LogInformation("Login attempt for email: {Email}", request.Email);

            var user = await _context.Users
                .Include(u => u.BusinessRoles)
                    .ThenInclude(br => br.Business)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            _logger.LogInformation("User found: {UserFound}", user != null);

            if (user == null)
            {
                _logger.LogWarning("User not found for email: {Email}", request.Email);
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Errors = new List<string> { "Authentication failed" }
                });
            }

            _logger.LogInformation("Password hash exists: {HasHash}", !string.IsNullOrEmpty(user.PasswordHash));

            if (string.IsNullOrEmpty(user.PasswordHash))
            {
                _logger.LogError("User {Email} has no password hash", request.Email);
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Errors = new List<string> { "Authentication failed" }
                });
            }

            _logger.LogInformation("Verifying password...");
            var passwordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            _logger.LogInformation("Password valid: {Valid}", passwordValid);

            if (!passwordValid)
            {
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "Invalid email or password",
                    Errors = new List<string> { "Authentication failed" }
                });
            }

            var defaultRole = user.BusinessRoles.FirstOrDefault();
            if (defaultRole == null)
            {
                return BadRequest(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "User has no associated business",
                    Errors = new List<string> { "No business found" }
                });
            }

            // Ensure role is not null, default to "Owner" if not set
            var role = defaultRole.Role ?? "Owner";

            var tokenResponse = _jwtService.GenerateToken(user, defaultRole.BusinessId, role);

            var response = new AuthResponse
            {
                AccessToken = tokenResponse.AccessToken,
                RefreshToken = tokenResponse.RefreshToken,
                ExpiresIn = tokenResponse.ExpiresIn,
                TokenType = tokenResponse.TokenType,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Businesses = user.BusinessRoles.Select(br => new BusinessRoleDto
                    {
                        BusinessId = br.BusinessId,
                        BusinessName = br.Business?.Name ?? "Unknown Business",
                        Role = br.Role
                    }).ToList()
                },
                DefaultBusiness = new FinLightSA.Core.DTOs.Business.BusinessDto
                {
                    Id = defaultRole.Business?.Id ?? Guid.Empty,
                    Name = defaultRole.Business.Name,
                    Industry = defaultRole.Business?.Industry ?? "Unknown",
                    SubscriptionPlan = defaultRole.Business?.SubscriptionPlan ?? "Free",
                    CreatedAt = defaultRole.Business?.CreatedAt ?? DateTime.UtcNow
                }
            };

            // Log successful login
            LogAuditAction("LOGIN", "AUTHENTICATION", user.Id, defaultRole.BusinessId, null, $"User {user.Email} logged in successfully");

            return Ok(new ApiResponse<AuthResponse>
            {
                Success = true,
                Message = "Login successful",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, new ApiResponse<AuthResponse>
            {
                Success = false,
                Message = "An error occurred during login",
                Errors = new List<string> { ex.Message }
            });
        }
    }

    [HttpGet("health")]
    public IActionResult Health()
    {
        return Ok(new { status = "healthy", service = "FinLight SA API", version = "1.0.0" });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            // Validate refresh token (in production, store refresh tokens in database with expiration)
            var principal = _jwtService.ValidateToken(request.AccessToken);
            if (principal == null)
            {
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "Invalid access token",
                    Errors = new List<string> { "Token validation failed" }
                });
            }

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "Invalid token claims",
                    Errors = new List<string> { "User ID not found in token" }
                });
            }

            var user = await _context.Users
                .Include(u => u.BusinessRoles)
                    .ThenInclude(br => br.Business)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                return Unauthorized(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "User not found",
                    Errors = new List<string> { "User associated with token no longer exists" }
                });
            }

            var defaultRole = user.BusinessRoles.FirstOrDefault();
            if (defaultRole == null)
            {
                return BadRequest(new ApiResponse<AuthResponse>
                {
                    Success = false,
                    Message = "User has no associated business",
                    Errors = new List<string> { "No business found" }
                });
            }

            // Generate new tokens
            var tokenResponse = _jwtService.GenerateToken(user, defaultRole.BusinessId, defaultRole.Role);

            var response = new AuthResponse
            {
                AccessToken = tokenResponse.AccessToken,
                RefreshToken = tokenResponse.RefreshToken,
                ExpiresIn = tokenResponse.ExpiresIn,
                TokenType = tokenResponse.TokenType,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Businesses = user.BusinessRoles.Select(br => new BusinessRoleDto
                    {
                        BusinessId = br.BusinessId,
                        BusinessName = br.Business?.Name ?? "Unknown Business",
                        Role = br.Role
                    }).ToList()
                },
                DefaultBusiness = new FinLightSA.Core.DTOs.Business.BusinessDto
                {
                    Id = defaultRole.Business?.Id ?? Guid.Empty,
                    Name = defaultRole.Business.Name,
                    Industry = defaultRole.Business?.Industry ?? "Unknown",
                    SubscriptionPlan = defaultRole.Business?.SubscriptionPlan ?? "Free",
                    CreatedAt = defaultRole.Business?.CreatedAt ?? DateTime.UtcNow
                }
            };

            return Ok(new ApiResponse<AuthResponse>
            {
                Success = true,
                Message = "Token refreshed successfully",
                Data = response
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return StatusCode(500, new ApiResponse<AuthResponse>
            {
                Success = false,
                Message = "An error occurred during token refresh",
                Errors = new List<string> { ex.Message }
            });
        }
    }
}