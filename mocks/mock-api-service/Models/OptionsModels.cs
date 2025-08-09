using System.ComponentModel.DataAnnotations;

namespace MockApiService.Models;

public class LoadOptionsResponse
{
    public Option[] Options { get; set; } = Array.Empty<Option>();
    public string LastModified { get; set; } = string.Empty;
}

public class SaveOptionsRequest
{
    [Required]
    public Option[] Options { get; set; } = Array.Empty<Option>();
}