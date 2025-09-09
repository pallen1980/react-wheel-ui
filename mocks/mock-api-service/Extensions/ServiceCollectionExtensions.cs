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
        
        // Register validation service
        services.AddScoped<IValidationService, OptionsValidationService>();
        
        // Register error simulation service
        services.AddSingleton<IErrorSimulationService, ErrorSimulationService>();
        
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
                    .AllowCredentials()
                    // Allow any localhost origin for development (requirement 7.3)
                    .SetIsOriginAllowed(origin =>
                    {
                        if (string.IsNullOrEmpty(origin)) return false;
                        
                        // Allow configured origins
                        if (allowedOrigins.Contains(origin)) return true;
                        
                        // Allow any localhost origin regardless of port
                        var uri = new Uri(origin);
                        return uri.Host == "localhost" || uri.Host == "127.0.0.1";
                    });
            });
        });
        
        return services;
    }
}