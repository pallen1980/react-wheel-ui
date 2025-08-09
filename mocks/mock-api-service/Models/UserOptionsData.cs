namespace MockApiService.Models;

public class UserOptionsData
{
    public Option[] Options { get; set; } = Array.Empty<Option>();
    public DateTime LastModified { get; set; }
    public string UserId { get; set; } = string.Empty;
}