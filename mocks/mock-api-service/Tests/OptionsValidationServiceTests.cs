using MockApiService.Models;
using MockApiService.Services;
using Xunit;

namespace MockApiService.Tests;

public class OptionsValidationServiceTests
{
    private readonly OptionsValidationService _validationService;

    public OptionsValidationServiceTests()
    {
        _validationService = new OptionsValidationService();
    }

    [Fact]
    public void ValidateOptions_WithNullOptions_ReturnsValid()
    {
        // Act
        var result = _validationService.ValidateOptions(null!);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Null(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithEmptyArray_ReturnsValid()
    {
        // Arrange
        var options = Array.Empty<Option>();

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Null(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithValidOptions_ReturnsValid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = 1 },
            new Option { Key = "option2", Value = "Option 2", Sequence = 2 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Null(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithNullOption_ReturnsInvalid()
    {
        // Arrange
        var options = new Option?[] { null };

        // Act
        var result = _validationService.ValidateOptions(options!);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option cannot be null", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithEmptyKey_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "", Value = "Option 1", Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option key is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithNullKey_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = null!, Value = "Option 1", Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option key is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithWhitespaceKey_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "   ", Value = "Option 1", Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option key is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithEmptyValue_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "", Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option value is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithNullValue_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = null!, Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option value is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithWhitespaceValue_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "   ", Sequence = 1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option value is required and cannot be empty", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithDuplicateKeys_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = 1 },
            new Option { Key = "option1", Value = "Option 1 Duplicate", Sequence = 2 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Options array contains duplicate keys", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithDuplicateKeysCaseInsensitive_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = 1 },
            new Option { Key = "OPTION1", Value = "Option 1 Duplicate", Sequence = 2 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Options array contains duplicate keys", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithMultipleDuplicateKeys_ReturnsInvalid()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = 1 },
            new Option { Key = "option1", Value = "Option 1 Duplicate", Sequence = 2 },
            new Option { Key = "option2", Value = "Option 2", Sequence = 3 },
            new Option { Key = "option2", Value = "Option 2 Duplicate", Sequence = 4 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Options array contains duplicate keys", result.ErrorMessage);
        Assert.NotNull(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithNegativeSequence_ReturnsValid()
    {
        // Arrange - negative sequence should be allowed
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = -1 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Null(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_WithZeroSequence_ReturnsValid()
    {
        // Arrange - zero sequence should be allowed
        var options = new[]
        {
            new Option { Key = "option1", Value = "Option 1", Sequence = 0 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
        Assert.Null(result.ErrorDetails);
    }

    [Fact]
    public void ValidateOptions_ReturnsCorrectErrorDetailsForInvalidKey()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "valid", Value = "Valid Option", Sequence = 1 },
            new Option { Key = "", Value = "Invalid Option", Sequence = 2 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option key is required and cannot be empty", result.ErrorMessage);
        
        var details = result.ErrorDetails as dynamic;
        Assert.NotNull(details);
        Assert.Equal(1, details.Index);
        Assert.Equal("key", details.Field);
        Assert.Equal("", details.Value);
    }

    [Fact]
    public void ValidateOptions_ReturnsCorrectErrorDetailsForInvalidValue()
    {
        // Arrange
        var options = new[]
        {
            new Option { Key = "valid", Value = "Valid Option", Sequence = 1 },
            new Option { Key = "invalid", Value = "", Sequence = 2 }
        };

        // Act
        var result = _validationService.ValidateOptions(options);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Option value is required and cannot be empty", result.ErrorMessage);
        
        var details = result.ErrorDetails as dynamic;
        Assert.NotNull(details);
        Assert.Equal(1, details.Index);
        Assert.Equal("value", details.Field);
        Assert.Equal("", details.Value);
    }
}