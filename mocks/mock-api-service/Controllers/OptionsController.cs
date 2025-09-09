using Microsoft.AspNetCore.Mvc;
using MockApiService.Models;
using MockApiService.Services;
using System.Security.Claims;

namespace MockApiService.Controllers;

[ApiController]
[Route("api/users/{userId}/options")]
public class OptionsController : ControllerBase
{
    private readonly IStorageService _storageService;
    private readonly ILogger<OptionsController> _logger;

    public OptionsController(IStorageService storageService, ILogger<OptionsController> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<LoadOptionsResponse>> GetUserOptions(string userId)
    {
        try
        {
            // Validate user ID matches authenticated user
            if (!IsAuthorizedForUser(userId))
            {
                _logger.LogWarning("User {AuthenticatedUserId} attempted to access options for user {RequestedUserId}", 
                    GetAuthenticatedUserId(), userId);
                return Forbid();
            }

            // Get user options from storage
            var options = await _storageService.GetUserOptionsAsync(userId);
            
            // Handle 404 for users with no saved options
            if (options == null)
            {
                _logger.LogInformation("No options found for user {UserId}", userId);
                return NotFound(new ErrorResponse
                {
                    Error = "NOT_FOUND",
                    Message = $"No options found for user {userId}"
                });
            }

            // Return options with last modified timestamp
            var response = new LoadOptionsResponse
            {
                Options = options,
                LastModified = DateTime.UtcNow.ToString("O") // ISO 8601 format
            };

            _logger.LogInformation("Successfully retrieved {OptionCount} options for user {UserId}", 
                options.Length, userId);
            
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid user ID provided: {UserId}", userId);
            return BadRequest(new ErrorResponse
            {
                Error = "INVALID_USER_ID",
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving options for user {UserId}", userId);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "An error occurred while retrieving user options"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult> SaveUserOptions(string userId, [FromBody] SaveOptionsRequest request)
    {
        try
        {
            // Validate user ID matches authenticated user
            if (!IsAuthorizedForUser(userId))
            {
                _logger.LogWarning("User {AuthenticatedUserId} attempted to save options for user {RequestedUserId}", 
                    GetAuthenticatedUserId(), userId);
                return Forbid();
            }

            // Validate request model
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid model state for save options request for user {UserId}", userId);
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            // Save options using storage service
            await _storageService.SaveUserOptionsAsync(userId, request.Options);
            
            _logger.LogInformation("Successfully saved {OptionCount} options for user {UserId}", 
                request.Options.Length, userId);
            
            return Ok();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Validation error saving options for user {UserId}", userId);
            return BadRequest(new ErrorResponse
            {
                Error = "VALIDATION_ERROR",
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving options for user {UserId}", userId);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_SERVER_ERROR",
                Message = "An error occurred while saving user options"
            });
        }
    }

    private bool IsAuthorizedForUser(string userId)
    {
        var authenticatedUserId = GetAuthenticatedUserId();
        
        if (string.IsNullOrEmpty(authenticatedUserId))
        {
            _logger.LogWarning("No authenticated user found in request context");
            return false;
        }

        return string.Equals(authenticatedUserId, userId, StringComparison.OrdinalIgnoreCase);
    }

    private string? GetAuthenticatedUserId()
    {
        // Try to get user ID from claims first
        var userIdFromClaims = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                              ?? User.FindFirst("user_id")?.Value;
        
        if (!string.IsNullOrEmpty(userIdFromClaims))
        {
            return userIdFromClaims;
        }

        // Fallback to HttpContext.Items (set by middleware)
        if (HttpContext.Items.TryGetValue("UserId", out var userIdFromItems) && userIdFromItems is string userId)
        {
            return userId;
        }

        return null;
    }
}