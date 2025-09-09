using MockApiService.Models;

namespace MockApiService.Services;

public interface IValidationService
{
    ValidationResult ValidateOptions(Option[] options);
}

public class ValidationResult
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public object? ErrorDetails { get; set; }
}