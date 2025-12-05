using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinLightSA.Core.DTOs.Auth;
using FinLightSA.Core.DTOs.Common;
using FinLightSA.Core.Models;
using FinLightSA.Infrastructure.Data;
using FinLightSA.Infrastructure.Services;
using BCrypt.Net;
using Google;

namespace FinLightSA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        ApplicationDbContext context,
        JwtService jwtService,
        ILogger<AuthController> logger)
    {
        _context = context;
        _jwtService = jwtService;
        _logger = logger;
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
            var token = _jwtService.GenerateToken(user, business.Id, "Owner");

            var response = new AuthResponse
            {
                Token = token,
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
            var user = await _context.Users
                .Include(u => u.BusinessRoles)
                    .ThenInclude(br => br.Business)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
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

            var token = _jwtService.GenerateToken(user, defaultRole.BusinessId, defaultRole.Role);

            var response = new AuthResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Phone = user.Phone,
                    Businesses = user.BusinessRoles.Select(br => new BusinessRoleDto
                    {
                        BusinessId = br.BusinessId,
                        BusinessName = br.Business.Name,
                        Role = br.Role
                    }).ToList()
                },
                DefaultBusiness = new FinLightSA.Core.DTOs.Business.BusinessDto
                {
                    Id = defaultRole.Business.Id,
                    Name = defaultRole.Business.Name,
                    Industry = defaultRole.Business.Industry,
                    SubscriptionPlan = defaultRole.Business.SubscriptionPlan,
                    CreatedAt = defaultRole.Business.CreatedAt
                }
            };

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
}