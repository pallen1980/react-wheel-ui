using MockApiService.Models;
using MockApiService.Services;
using Xunit;

namespace MockApiService.Tests;

public class InMemoryStorageServiceTests
{
    private readonly InMemoryStorageService _storageService;

    public InMemoryStorageServiceTests()
    {
        _storageService = new InMemoryStorageService();
    }

    [Fact]
    public async Task GetUserOptionsAsync_WithValidUserId_ReturnsNull_WhenNoDataExists()
    {
        // Arrange
        var userId = "test-user-1";

        // Act
        var result = await _storageService.GetUserOptionsAsync(userId);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetUserOptionsAsync_WithNullUserId_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _storageService.GetUserOptionsAsync(null!));
    }

    [Fact]
    public async Task GetUserOptionsAsync_WithEmptyUserId_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _storageService.GetUserOptionsAsync(""));
    }

    [Fact]
    public async Task GetUserOptionsAsync_WithWhitespaceUserId_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _storageService.GetUserOptionsAsync("   "));
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithValidOptions_SavesSuccessfully()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = 1 },
            new() { Key = "option2", Value = "Option 2", Sequence = 2 }
        };

        // Act
        await _storageService.SaveUserOptionsAsync(userId, options);
        var result = await _storageService.GetUserOptionsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Length);
        Assert.Equal("option1", result[0].Key);
        Assert.Equal("Option 1", result[0].Value);
        Assert.Equal(1, result[0].Sequence);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithEmptyArray_ClearsUserOptions()
    {
        // Arrange
        var userId = "test-user-1";
        var initialOptions = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = 1 }
        };

        // Act
        await _storageService.SaveUserOptionsAsync(userId, initialOptions);
        var initialResult = await _storageService.GetUserOptionsAsync(userId);
        
        await _storageService.SaveUserOptionsAsync(userId, Array.Empty<Option>());
        var finalResult = await _storageService.GetUserOptionsAsync(userId);

        // Assert
        Assert.NotNull(initialResult);
        Assert.Single(initialResult);
        Assert.Null(finalResult);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithNullUserId_ThrowsArgumentException()
    {
        // Arrange
        var options = new Option[] { new() { Key = "test", Value = "Test", Sequence = 1 } };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(null!, options));
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithNullOptions_ThrowsArgumentNullException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentNullException>(() => _storageService.SaveUserOptionsAsync("user1", null!));
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithEmptyKey_ThrowsArgumentException()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "", Value = "Option 1", Sequence = 1 }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(userId, options));
        Assert.Contains("Option at index 0 has invalid key", exception.Message);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithNullKey_ThrowsArgumentException()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = null!, Value = "Option 1", Sequence = 1 }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(userId, options));
        Assert.Contains("Option at index 0 has invalid key", exception.Message);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithEmptyValue_ThrowsArgumentException()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "", Sequence = 1 }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(userId, options));
        Assert.Contains("Option at index 0 has invalid value", exception.Message);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithNullValue_ThrowsArgumentException()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = null!, Sequence = 1 }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(userId, options));
        Assert.Contains("Option at index 0 has invalid value", exception.Message);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithDuplicateKeys_ThrowsArgumentException()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = 1 },
            new() { Key = "option1", Value = "Option 1 Duplicate", Sequence = 2 }
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ArgumentException>(() => _storageService.SaveUserOptionsAsync(userId, options));
        Assert.Contains("Duplicate key found: 'option1'", exception.Message);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_WithNegativeSequence_SavesSuccessfully()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = -1 }
        };

        // Act
        await _storageService.SaveUserOptionsAsync(userId, options);
        var result = await _storageService.GetUserOptionsAsync(userId);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result);
        Assert.Equal(-1, result[0].Sequence);
    }

    [Fact]
    public async Task SaveUserOptionsAsync_MultipleUsers_KeepsDataSeparate()
    {
        // Arrange
        var user1Id = "user1";
        var user2Id = "user2";
        var user1Options = new Option[]
        {
            new() { Key = "option1", Value = "User 1 Option", Sequence = 1 }
        };
        var user2Options = new Option[]
        {
            new() { Key = "option1", Value = "User 2 Option", Sequence = 1 }
        };

        // Act
        await _storageService.SaveUserOptionsAsync(user1Id, user1Options);
        await _storageService.SaveUserOptionsAsync(user2Id, user2Options);
        
        var user1Result = await _storageService.GetUserOptionsAsync(user1Id);
        var user2Result = await _storageService.GetUserOptionsAsync(user2Id);

        // Assert
        Assert.NotNull(user1Result);
        Assert.NotNull(user2Result);
        Assert.Equal("User 1 Option", user1Result[0].Value);
        Assert.Equal("User 2 Option", user2Result[0].Value);
    }

    [Fact]
    public async Task ClearUserOptionsAsync_WithValidUserId_ClearsData()
    {
        // Arrange
        var userId = "test-user-1";
        var options = new Option[]
        {
            new() { Key = "option1", Value = "Option 1", Sequence = 1 }
        };

        // Act
        await _storageService.SaveUserOptionsAsync(userId, options);
        var beforeClear = await _storageService.GetUserOptionsAsync(userId);
        
        await _storageService.ClearUserOptionsAsync(userId);
        var afterClear = await _storageService.GetUserOptionsAsync(userId);

        // Assert
        Assert.NotNull(beforeClear);
        Assert.Null(afterClear);
    }

    [Fact]
    public async Task ClearUserOptionsAsync_WithNullUserId_ThrowsArgumentException()
    {
        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => _storageService.ClearUserOptionsAsync(null!));
    }

    [Fact]
    public async Task ClearUserOptionsAsync_WithNonExistentUser_DoesNotThrow()
    {
        // Act & Assert - Should not throw
        await _storageService.ClearUserOptionsAsync("non-existent-user");
    }
}