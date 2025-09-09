using System.Collections.Concurrent;
using MockApiService.Models;

namespace MockApiService.Services;

public class InMemoryStorageService : IStorageService
{
    private readonly ConcurrentDictionary<string, UserOptionsData> _storage = new();

    public Task<Option[]?> GetUserOptionsAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        if (_storage.TryGetValue(userId, out var data))
        {
            return Task.FromResult<Option[]?>(data.Options);
        }
        return Task.FromResult<Option[]?>(null);
    }

    public Task SaveUserOptionsAsync(string userId, Option[] options)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        if (options == null)
        {
            throw new ArgumentNullException(nameof(options));
        }

        // Validate options data
        ValidateOptions(options);

        // If options array is empty, clear the user's saved options
        if (options.Length == 0)
        {
            _storage.TryRemove(userId, out _);
            return Task.CompletedTask;
        }

        var data = new UserOptionsData
        {
            Options = options,
            LastModified = DateTime.UtcNow,
            UserId = userId
        };
        
        _storage.AddOrUpdate(userId, data, (key, oldValue) => data);
        return Task.CompletedTask;
    }

    public Task ClearUserOptionsAsync(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            throw new ArgumentException("User ID cannot be null or empty", nameof(userId));
        }

        _storage.TryRemove(userId, out _);
        return Task.CompletedTask;
    }

    private static void ValidateOptions(Option[] options)
    {
        var keys = new HashSet<string>();
        
        for (int i = 0; i < options.Length; i++)
        {
            var option = options[i];
            
            // Validate required fields
            if (string.IsNullOrWhiteSpace(option.Key))
            {
                throw new ArgumentException($"Option at index {i} has invalid key: key cannot be null or empty");
            }
            
            if (string.IsNullOrWhiteSpace(option.Value))
            {
                throw new ArgumentException($"Option at index {i} has invalid value: value cannot be null or empty");
            }
            
            // Sequence can be any integer, including negative numbers, so no validation needed
            
            // Check for duplicate keys
            if (!keys.Add(option.Key))
            {
                throw new ArgumentException($"Duplicate key found: '{option.Key}'. Each option must have a unique key.");
            }
        }
    }
}