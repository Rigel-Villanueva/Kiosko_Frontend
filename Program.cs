using KioskoAPI.Models;
using KioskoAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure MongoDB options
builder.Services.Configure<KioskoDatabaseSettings>(
    builder.Configuration.GetSection("KioskoDatabase"));

// Register Services
builder.Services.AddSingleton<ProyectosService>();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
