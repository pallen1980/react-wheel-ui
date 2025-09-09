using System.Collections.Concurrent;
using MockApiService.Exceptions;

namespace MockApiService.Services;

public class ErrorSimulationService : IErrorSimulationService
{
    private readonly ConcurrentDictionary<string, (string errorType, int? delayMs)> _configuredErrors = new();
    private bool _errorSimulationEnabled = false;
    private readonly ILogger<ErrorSimulationService> _logger;

    public ErrorSimulationService(ILogger<ErrorSimulationService> logger)
    {
        _logger = logger;
    }

    public void SetErrorSimulationEnabled(bool enabled)
    {
        _errorSimulationEnabled = enabled;
        _logger.LogInformation("Error simulation {Status}", enabled ? "enabled" : "disabled");
    }

    public void ConfigureError(string endpoint, string errorType, int? delayMs = null)
    {
        _configuredErrors[endpoint] = (errorType, delayMs);
        _logger.LogInformation("Configured error {ErrorType} for endpoint {Endpoint} with delay {DelayMs}ms", 
            errorType, endpoint, delayMs);
    }

    public void ClearAllErrors()
    {
        _configuredErrors.Clear();
        _logger.LogInformation("Cleared all configured errors");
    }

    public async Task<bool> ShouldSimulateErrorAsync(string endpoint)
    {
        if (!_errorSimulationEnabled)
            return false;

        var hasError = _configuredErrors.ContainsKey(endpoint);
        
        if (hasError)
        {
            _logger.LogDebug("Error simulation triggered for endpoint {Endpoint}", endpoint);
        }
        
        return await Task.FromResult(hasError);
    }

    public async Task<(string? errorType, int? delayMs)> GetConfiguredErrorAsync(string endpoint)
    {
        if (!_errorSimulationEnabled || !_configuredErrors.TryGetValue(endpoint, out var error))
        {
            return (null, null);
        }

        return await Task.FromResult(error);
    }

    public async Task SimulateNetworkDelayAsync(int delayMs)
    {
        if (delayMs > 0)
        {
            _logger.LogDebug("Simulating network delay of {DelayMs}ms", delayMs);
            await Task.Delay(delayMs);
        }
    }

    /// <summary>
    /// Throw the appropriate exception based on error type
    /// </summary>
    public static Exception CreateExceptionForErrorType(string errorType)
    {
        return errorType.ToUpperInvariant() switch
        {
            "TIMEOUT" => new TimeoutException("Simulated timeout error"),
            "AUTHENTICATION_ERROR" => new AuthenticationException("Simulated authentication error"),
            "AUTHORIZATION_ERROR" => new AuthorizationException("Simulated authorization error"),
            "VALIDATION_ERROR" => new ValidationException("Simulated validation error"),
            "NOT_FOUND" => new ResourceNotFoundException("Simulated resource not found error"),
            "CONFLICT" => new ResourceConflictException("Simulated resource conflict error"),
            "RATE_LIMIT" => new RateLimitException("Simulated rate limit exceeded", TimeSpan.FromMinutes(1)),
            "SERVICE_UNAVAILABLE" => new ServiceUnavailableException("Simulated service unavailable error"),
            "INTERNAL_SERVER_ERROR" => new InvalidOperationException("Simulated internal server error"),
            _ => new InvalidOperationException($"Unknown error type: {errorType}")
        };
    }
}