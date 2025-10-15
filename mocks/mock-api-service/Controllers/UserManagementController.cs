using Microsoft.AspNetCore.Mvc;
using MockApiService.Models;
using MockApiService.Services;

namespace MockApiService.Controllers;

[ApiController]
[Route("api/users")]
public class UserManagementController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IErrorSimulationService _errorSimulationService;
    private readonly ILogger<UserManagementController> _logger;

    public UserManagementController(IAuthService authService, IErrorSimulationService errorSimulationService, ILogger<UserManagementController> logger)
    {
        _authService = authService;
        _errorSimulationService = errorSimulationService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MockUser>>> GetAllUsers()
    {
        try
        {
            // Check for error simulation
            var endpoint = "/v1/users";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }

            var users = await _authService.GetAllUsersAsync();
            _logger.LogInformation("Retrieved {UserCount} users", users.Count());
            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred while retrieving users"
            });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MockUser>> GetUserById(string id)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/v1/users/{id}";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }

            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "INVALID_USER_ID",
                    Message = "User ID is required"
                });
            }

            var user = await _authService.GetUserByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User not found: {UserId}", id);
                return NotFound(new ErrorResponse
                {
                    Error = "USER_NOT_FOUND",
                    Message = "User not found"
                });
            }

            _logger.LogInformation("Retrieved user: {UserId}", id);
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user: {UserId}", id);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred while retrieving the user"
            });
        }
    }

    [HttpPost]
    public async Task<ActionResult<MockUser>> CreateUser([FromBody] CreateUserRequest request)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/v1/users";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            var user = await _authService.CreateUserAsync(request);
            if (user == null)
            {
                _logger.LogWarning("User creation failed - email already exists: {Email}", request.Email);
                return Conflict(new ErrorResponse
                {
                    Error = "EMAIL_EXISTS",
                    Message = "A user with this email already exists"
                });
            }

            _logger.LogInformation("User created successfully: {UserId}", user.Uid);
            return CreatedAtAction(nameof(GetUserById), new { id = user.Uid }, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user: {Email}", request.Email);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred while creating the user"
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<MockUser>> UpdateUser(string id, [FromBody] UpdateUserRequest request)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/v1/users/{id}";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }

            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "INVALID_USER_ID",
                    Message = "User ID is required"
                });
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "VALIDATION_ERROR",
                    Message = "Invalid request data",
                    Details = ModelState
                });
            }

            // Check if at least one field is provided for update
            if (string.IsNullOrEmpty(request.Email) && 
                string.IsNullOrEmpty(request.DisplayName) && 
                string.IsNullOrEmpty(request.Password))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "NO_UPDATE_DATA",
                    Message = "At least one field must be provided for update"
                });
            }

            var user = await _authService.UpdateUserAsync(id, request);
            if (user == null)
            {
                // Check if user exists first
                var existingUser = await _authService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    _logger.LogWarning("Update failed - user not found: {UserId}", id);
                    return NotFound(new ErrorResponse
                    {
                        Error = "USER_NOT_FOUND",
                        Message = "User not found"
                    });
                }
                else
                {
                    _logger.LogWarning("Update failed - email already exists: {Email}", request.Email);
                    return Conflict(new ErrorResponse
                    {
                        Error = "EMAIL_EXISTS",
                        Message = "A user with this email already exists"
                    });
                }
            }

            _logger.LogInformation("User updated successfully: {UserId}", id);
            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user: {UserId}", id);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred while updating the user"
            });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteUser(string id)
    {
        try
        {
            // Check for error simulation
            var endpoint = "/v1/users/{id}";
            if (await _errorSimulationService.ShouldSimulateErrorAsync(endpoint))
            {
                var (errorType, delayMs) = await _errorSimulationService.GetConfiguredErrorAsync(endpoint);
                if (delayMs.HasValue)
                {
                    await _errorSimulationService.SimulateNetworkDelayAsync(delayMs.Value);
                }
                if (!string.IsNullOrEmpty(errorType))
                {
                    throw ErrorSimulationService.CreateExceptionForErrorType(errorType);
                }
            }

            if (string.IsNullOrWhiteSpace(id))
            {
                return BadRequest(new ErrorResponse
                {
                    Error = "INVALID_USER_ID",
                    Message = "User ID is required"
                });
            }

            var deleted = await _authService.DeleteUserAsync(id);
            if (!deleted)
            {
                _logger.LogWarning("Delete failed - user not found: {UserId}", id);
                return NotFound(new ErrorResponse
                {
                    Error = "USER_NOT_FOUND",
                    Message = "User not found"
                });
            }

            _logger.LogInformation("User deleted successfully: {UserId}", id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user: {UserId}", id);
            return StatusCode(500, new ErrorResponse
            {
                Error = "INTERNAL_ERROR",
                Message = "An internal error occurred while deleting the user"
            });
        }
    }
}
