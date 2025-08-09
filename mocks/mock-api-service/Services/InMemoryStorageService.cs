using System.Collections.Concurrent;
using MockApiService.Models;

namespace MockApiService.Services;

public class InMemoryStorageService : IStorageService
{
    private readonly ConcurrentDictionary<string, UserOptionsData> _storage = new();

    public Task<Option[]?> GetUserOptionsAsync(string userId)
    {
        if (_storage.TryGetValue(userId, out var data))
        {
            return Task.FromResult<Option[]?>(data.Options);
        }
        return Task.FromResult<Option[]?>(null);
    }

    public Task SaveUserOptionsAsync(string userId, Option[] options)
    {
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
        _storage.TryRemove(userId, out _);
        return Task.CompletedTask;
    }
}