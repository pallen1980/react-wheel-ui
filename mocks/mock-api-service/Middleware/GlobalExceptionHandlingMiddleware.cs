using System.Net;
using System.Text.Json;
using MockApiService.Models;
using MockApiService.Exceptions;

namespace MockApiService.Middleware;

public class GlobalExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlingMiddleware> _logger;

    public GlobalExceptionHandlingMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred while processing request {Method} {Path}", 
                context.Request.Method, context.Request.Path);
            
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var (statusCode, errorResponse) = exception switch
        {
            // Custom API exceptions
            AuthenticationException authEx => (HttpStatusCode.Unauthorized, new ErrorResponse
            {
                Error = authEx.ErrorCode,
                Message = authEx.Message,
                Details = authEx.ErrorDetails
            }),
            AuthorizationException authzEx => (HttpStatusCode.Forbidden, new ErrorResponse
            {
                Error = authzEx.ErrorCode,
                Message = authzEx.Message,
                Details = authzEx.ErrorDetails
            }),
            ValidationException validationEx => (HttpStatusCode.BadRequest, new ErrorResponse
            {
                Error = validationEx.ErrorCode,
                Message = validationEx.Message,
                Details = validationEx.ErrorDetails
            }),
            ResourceNotFoundException notFoundEx => (HttpStatusCode.NotFound, new ErrorResponse
            {
                Error = notFoundEx.ErrorCode,
                Message = notFoundEx.Message,
                Details = notFoundEx.ErrorDetails
            }),
            ResourceConflictException conflictEx => (HttpStatusCode.Conflict, new ErrorResponse
            {
                Error = conflictEx.ErrorCode,
                Message = conflictEx.Message,
                Details = conflictEx.ErrorDetails
            }),
            RateLimitException rateLimitEx => (HttpStatusCode.TooManyRequests, new ErrorResponse
            {
                Error = rateLimitEx.ErrorCode,
                Message = rateLimitEx.Message,
                Details = new { retryAfter = rateLimitEx.RetryAfter.TotalSeconds, details = rateLimitEx.ErrorDetails }
            }),
            ServiceUnavailableException serviceEx => (HttpStatusCode.ServiceUnavailable, new ErrorResponse
            {
                Error = serviceEx.ErrorCode,
                Message = serviceEx.Message,
                Details = serviceEx.ErrorDetails
            }),
            
            // Standard .NET exceptions (order matters - more specific exceptions first)
            ArgumentNullException nullEx => (HttpStatusCode.BadRequest, new ErrorResponse
            {
                Error = "VALIDATION_ERROR", 
                Message = "Required parameter is null or empty",
                Details = new { parameter = nullEx.ParamName }
            }),
            ArgumentException argEx => (HttpStatusCode.BadRequest, new ErrorResponse
            {
                Error = "VALIDATION_ERROR",
                Message = argEx.Message,
                Details = new { parameter = argEx.ParamName }
            }),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, new ErrorResponse
            {
                Error = "UNAUTHORIZED",
                Message = "Access denied"
            }),
            InvalidOperationException invalidOpEx => (HttpStatusCode.BadRequest, new ErrorResponse
            {
                Error = "INVALID_OPERATION",
                Message = invalidOpEx.Message
            }),
            NotSupportedException notSupportedEx => (HttpStatusCode.BadRequest, new ErrorResponse
            {
                Error = "NOT_SUPPORTED",
                Message = notSupportedEx.Message
            }),
            TimeoutException => (HttpStatusCode.RequestTimeout, new ErrorResponse
            {
                Error = "TIMEOUT",
                Message = "The operation timed out"
            }),
            TaskCanceledException => (HttpStatusCode.RequestTimeout, new ErrorResponse
            {
                Error = "OPERATION_CANCELLED",
                Message = "The operation was cancelled"
            }),
            
            // Default case for unhandled exceptions
            _ => (HttpStatusCode.InternalServerError, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "An unexpected error occurred"
            })
        };

        context.Response.StatusCode = (int)statusCode;

        // Add Retry-After header for rate limit exceptions
        if (exception is RateLimitException rateLimitException)
        {
            context.Response.Headers["Retry-After"] = ((int)rateLimitException.RetryAfter.TotalSeconds).ToString();
        }

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(jsonResponse);
    }
}