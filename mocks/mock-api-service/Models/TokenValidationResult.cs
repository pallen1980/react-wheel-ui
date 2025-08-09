namespace MockApiService.Models;

public class TokenValidationResult
{
    public bool IsValid { get; set; }
    public string? UserId { get; set; }
    public string? Email { get; set; }
    public string? ErrorMessage { get; set; }
}