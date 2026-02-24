using KioskoAPI.Models;
using KioskoAPI.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure MongoDB options
builder.Services.Configure<KioskoDatabaseSettings>(
    builder.Configuration.GetSection("KioskoDatabase"));

// Register Services
builder.Services.AddSingleton<ProyectosService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
