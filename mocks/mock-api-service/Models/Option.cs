using System.ComponentModel.DataAnnotations;

namespace MockApiService.Models;

public class Option
{
    [Required]
    public string Key { get; set; } = string.Empty;
    
    [Required]
    public string Value { get; set; } = string.Empty;
    
    [Required]
    public int Sequence { get; set; }
}