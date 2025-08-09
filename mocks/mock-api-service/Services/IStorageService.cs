using MockApiService.Models;

namespace MockApiService.Services;

public interface IStorageService
{
    Task<Option[]?> GetUserOptionsAsync(string userId);
    Task SaveUserOptionsAsync(string userId, Option[] options);
    Task ClearUserOptionsAsync(string userId);
}