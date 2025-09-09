namespace MockApiService.Services;

/// <summary>
/// Service for simulating various error scenarios for testing purposes
/// </summary>
public interface IErrorSimulationService
{
    /// <summary>
    /// Enable or disable error simulation
    /// </summary>
    void SetErrorSimulationEnabled(bool enabled);
    
    /// <summary>
    /// Configure a specific error to be thrown for a given endpoint
    /// </summary>
    void ConfigureError(string endpoint, string errorType, int? delayMs = null);
    
    /// <summary>
    /// Clear all configured errors
    /// </summary>
    void ClearAllErrors();
    
    /// <summary>
    /// Check if an error should be simulated for the given endpoint
    /// </summary>
    Task<bool> ShouldSimulateErrorAsync(string endpoint);
    
    /// <summary>
    /// Get the configured error for an endpoint, if any
    /// </summary>
    Task<(string? errorType, int? delayMs)> GetConfiguredErrorAsync(string endpoint);
    
    /// <summary>
    /// Simulate network delay
    /// </summary>
    Task SimulateNetworkDelayAsync(int delayMs);
}