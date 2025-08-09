using MockApiService.Services;

namespace MockApiService.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddMockApiServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register storage service
        services.AddSingleton<IStorageService, InMemoryStorageService>();
        
        // Register authentication services
        services.AddScoped<IAuthService, MockAuthService>();
        services.AddScoped<ITokenService, MockTokenService>();
        
        // Configure CORS
        services.AddCors(options =>
        {
            options.AddDefaultPolicy(builder =>
            {
                var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                    ?? new[] { "http://localhost:5173" };
                
                builder
                    .WithOrigins(allowedOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });
        });
        
        return services;
    }
}