using Microsoft.AspNetCore.Mvc;
using MockApiService.Models;
using MockApiService.Services;

namespace MockApiService.Controllers;

[ApiController]
[Route("api/error-simulation")]
public class ErrorSimulationController : ControllerBase
{
    private readonly IErrorSimulationService _errorSimulationService;
    private readonly ILogger<ErrorSimulationController> _logger;

    public ErrorSimulationController(IErrorSimulationService errorSimulationService, ILogger<ErrorSimulationController> logger)
    {
        _errorSimulationService = errorSimulationService;
        _logger = logger;
    }

    [HttpPost("enable")]
    public ActionResult EnableErrorSimulation()
    {
        try
        {
            _errorSimulationService.SetErrorSimulationEnabled(true);
            _logger.LogInformation("Error simulation enabled via API");
            return Ok(new { message = "Error simulation enabled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enabling error simulation");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "Failed to enable error simulation"
            });
        }
    }

    [HttpPost("disable")]
    public ActionResult DisableErrorSimulation()
    {
        try
        {
            _errorSimulationService.SetErrorSimulationEnabled(false);
            _logger.LogInformation("Error simulation disabled via API");
            return Ok(new { message = "Error simulation disabled" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error disabling error simulation");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "Failed to disable error simulation"
            });
        }
    }

    [HttpPost("configure")]
    public ActionResult ConfigureError([FromBody] ConfigureErrorRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            _errorSimulationService.ConfigureError(request.Endpoint, request.ErrorType, request.DelayMs);
            _logger.LogInformation("Configured error {ErrorType} for endpoint {Endpoint}", request.ErrorType, request.Endpoint);
            
            return Ok(new { message = $"Error {request.ErrorType} configured for endpoint {request.Endpoint}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error configuring error simulation");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "Failed to configure error simulation"
            });
        }
    }

    [HttpDelete("clear")]
    public ActionResult ClearAllErrors()
    {
        try
        {
            _errorSimulationService.ClearAllErrors();
            _logger.LogInformation("Cleared all error configurations via API");
            return Ok(new { message = "All error configurations cleared" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing error configurations");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "Failed to clear error configurations"
            });
        }
    }

    [HttpPost("trigger/{errorType}")]
    public ActionResult TriggerError(string errorType)
    {
        try
        {
            var exception = ErrorSimulationService.CreateExceptionForErrorType(errorType);
            _logger.LogInformation("Manually triggering error type: {ErrorType}", errorType);
            throw exception;
        }
        catch (Exception ex) when (ex.GetType() != typeof(InvalidOperationException) || !ex.Message.StartsWith("Unknown error type"))
        {
            // Re-throw the intended exception for testing
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering error simulation");
            return BadRequest(new ErrorResponse
            {
                Error = "INVALID_ERROR_TYPE",
                Message = ex.Message
            });
        }
    }
}

public class ConfigureErrorRequest
{
    public string Endpoint { get; set; } = string.Empty;
    public string ErrorType { get; set; } = string.Empty;
    public int? DelayMs { get; set; }
}