using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using Supabase;
using Supabase.Postgrest;

namespace FinLightSA.API.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;

        public JwtMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            // You can add logging, token debugging, etc.
            await _next(context);
        }
    }
}
