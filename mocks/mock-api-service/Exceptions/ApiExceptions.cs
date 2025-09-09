namespace MockApiService.Exceptions;

/// <summary>
/// Base exception for API-specific errors
/// </summary>
public abstract class ApiException : Exception
{
    public string ErrorCode { get; }
    public object? ErrorDetails { get; }

    protected ApiException(string errorCode, string message, object? details = null) : base(message)
    {
        ErrorCode = errorCode;
        ErrorDetails = details;
    }

    protected ApiException(string errorCode, string message, Exception innerException, object? details = null) 
        : base(message, innerException)
    {
        ErrorCode = errorCode;
        ErrorDetails = details;
    }
}

/// <summary>
/// Exception for authentication-related errors
/// </summary>
public class AuthenticationException : ApiException
{
    public AuthenticationException(string message, object? details = null) 
        : base("AUTHENTICATION_ERROR", message, details)
    {
    }

    public AuthenticationException(string message, Exception innerException, object? details = null) 
        : base("AUTHENTICATION_ERROR", message, innerException, details)
    {
    }
}

/// <summary>
/// Exception for authorization-related errors
/// </summary>
public class AuthorizationException : ApiException
{
    public AuthorizationException(string message, object? details = null) 
        : base("AUTHORIZATION_ERROR", message, details)
    {
    }

    public AuthorizationException(string message, Exception innerException, object? details = null) 
        : base("AUTHORIZATION_ERROR", message, innerException, details)
    {
    }
}

/// <summary>
/// Exception for validation errors
/// </summary>
public class ValidationException : ApiException
{
    public ValidationException(string message, object? details = null) 
        : base("VALIDATION_ERROR", message, details)
    {
    }

    public ValidationException(string message, Exception innerException, object? details = null) 
        : base("VALIDATION_ERROR", message, innerException, details)
    {
    }
}

/// <summary>
/// Exception for resource not found errors
/// </summary>
public class ResourceNotFoundException : ApiException
{
    public ResourceNotFoundException(string message, object? details = null) 
        : base("NOT_FOUND", message, details)
    {
    }

    public ResourceNotFoundException(string message, Exception innerException, object? details = null) 
        : base("NOT_FOUND", message, innerException, details)
    {
    }
}

/// <summary>
/// Exception for resource conflict errors
/// </summary>
public class ResourceConflictException : ApiException
{
    public ResourceConflictException(string message, object? details = null) 
        : base("CONFLICT", message, details)
    {
    }

    public ResourceConflictException(string message, Exception innerException, object? details = null) 
        : base("CONFLICT", message, innerException, details)
    {
    }
}

/// <summary>
/// Exception for rate limiting errors
/// </summary>
public class RateLimitException : ApiException
{
    public TimeSpan RetryAfter { get; }

    public RateLimitException(string message, TimeSpan retryAfter, object? details = null) 
        : base("RATE_LIMIT_EXCEEDED", message, details)
    {
        RetryAfter = retryAfter;
    }
}

/// <summary>
/// Exception for service unavailable errors
/// </summary>
public class ServiceUnavailableException : ApiException
{
    public ServiceUnavailableException(string message, object? details = null) 
        : base("SERVICE_UNAVAILABLE", message, details)
    {
    }

    public ServiceUnavailableException(string message, Exception innerException, object? details = null) 
        : base("SERVICE_UNAVAILABLE", message, innerException, details)
    {
    }
}