using MockApiService.Extensions;
using MockApiService.Middleware;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization for consistent API responses
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = true;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add mock API services (includes CORS configuration)
builder.Services.AddMockApiServices(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline in proper order
// 1. Development tools (Swagger)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// 2. Global exception handling middleware (must be first to catch all exceptions)
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

// 3. CORS middleware (must be before authentication and authorization)
app.UseCors();

// 4. Request parsing and routing
app.UseRouting();

// Don't use HTTPS redirection for development mock service
// app.UseHttpsRedirection();

// 5. Authentication middleware (before authorization)
app.UseMiddleware<MockFirebaseAuthMiddleware>();

// 6. Authorization middleware (after authentication)
app.UseAuthorization();

// 7. Map controllers (final step)
app.MapControllers();

// Add health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();

// Make Program class accessible for testing
public partial class Program { }
