using MockApiService.Models;

namespace MockApiService.Services;

public class OptionsValidationService : IValidationService
{
    public ValidationResult ValidateOptions(Option[] options)
    {
        // Empty options array is valid (clears user's saved options)
        if (options == null || options.Length == 0)
        {
            return new ValidationResult { IsValid = true };
        }

        // Validate each option has required fields
        for (int i = 0; i < options.Length; i++)
        {
            var option = options[i];
            
            // Check for null option
            if (option == null)
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Option cannot be null",
                    ErrorDetails = new { Index = i }
                };
            }

            // Validate key field
            if (string.IsNullOrWhiteSpace(option.Key))
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Option key is required and cannot be empty",
                    ErrorDetails = new { Index = i, Field = "key", Value = option.Key }
                };
            }

            // Validate value field
            if (string.IsNullOrWhiteSpace(option.Value))
            {
                return new ValidationResult
                {
                    IsValid = false,
                    ErrorMessage = "Option value is required and cannot be empty",
                    ErrorDetails = new { Index = i, Field = "value", Value = option.Value }
                };
            }

            // Validate sequence field (should be a valid number)
            // Note: sequence can be negative or zero, just needs to be a valid integer
        }

        // Check for duplicate keys
        var duplicateKeys = options
            .GroupBy(o => o.Key, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicateKeys.Any())
        {
            return new ValidationResult
            {
                IsValid = false,
                ErrorMessage = "Options array contains duplicate keys",
                ErrorDetails = new { DuplicateKeys = duplicateKeys }
            };
        }

        return new ValidationResult { IsValid = true };
    }
}