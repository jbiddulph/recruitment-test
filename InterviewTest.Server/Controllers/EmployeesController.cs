using InterviewTest.Server.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;

namespace InterviewTest.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        [HttpGet]
        public List<Employee> Get()
        {
            var employees = new List<Employee>();

            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();

                var queryCmd = connection.CreateCommand();
                queryCmd.CommandText = @"SELECT Name, Value FROM Employees";
                using (var reader = queryCmd.ExecuteReader())
                {
                    while (reader.Read())
                    {
                        employees.Add(new Employee
                        {
                            Name = reader.GetString(0),
                            Value = reader.GetInt32(1)
                        });
                    }
                }
            }

            return employees;
        }

        [HttpPost]
        public IActionResult Add([FromBody] Employee employee)
        {
            if (string.IsNullOrWhiteSpace(employee?.Name)) return BadRequest("Name required");
            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();
                var cmd = connection.CreateCommand();
                cmd.CommandText = @"INSERT INTO Employees (Name, Value) VALUES ($name, $value)";
                cmd.Parameters.AddWithValue("$name", employee!.Name);
                cmd.Parameters.AddWithValue("$value", employee!.Value);
                cmd.ExecuteNonQuery();
            }
            return NoContent();
        }

        [HttpPost("update")]
        public IActionResult UpdateEmployee([FromBody] UpdateEmployeeRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.OriginalName)) return BadRequest("Original name required");
            if (string.IsNullOrWhiteSpace(request?.NewName)) return BadRequest("New name required");
            
            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();
                using var tx = connection.BeginTransaction();
                
                // Update the employee with new name and value
                var cmd = connection.CreateCommand();
                cmd.CommandText = @"UPDATE Employees SET Name = $newName, Value = $value WHERE Name = $originalName";
                cmd.Parameters.AddWithValue("$originalName", request!.OriginalName);
                cmd.Parameters.AddWithValue("$newName", request!.NewName);
                cmd.Parameters.AddWithValue("$value", request!.Value);
                var rows = cmd.ExecuteNonQuery();
                
                if (rows == 0) 
                {
                    tx.Rollback();
                    return NotFound();
                }
                
                tx.Commit();
            }
            return NoContent();
        }
        
        public class UpdateEmployeeRequest
        {
            public string OriginalName { get; set; }
            public string NewName { get; set; }
            public int Value { get; set; }
        }

        [HttpDelete]
        public IActionResult Delete([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return BadRequest("Name required");
            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();
                var cmd = connection.CreateCommand();
                cmd.CommandText = @"DELETE FROM Employees WHERE Name = $name";
                cmd.Parameters.AddWithValue("$name", name);
                var rows = cmd.ExecuteNonQuery();
                if (rows == 0) return NotFound();
            }
            return NoContent();
        }

        [HttpPost("increment-rule")]
        public IActionResult IncrementRule()
        {
            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();
                using var tx = connection.BeginTransaction();

                // E +1
                var cmdE = connection.CreateCommand();
                cmdE.CommandText = @"UPDATE Employees SET Value = Value + 1 WHERE Name LIKE 'E%'";
                cmdE.ExecuteNonQuery();

                // G +10
                var cmdG = connection.CreateCommand();
                cmdG.CommandText = @"UPDATE Employees SET Value = Value + 10 WHERE Name LIKE 'G%'";
                cmdG.ExecuteNonQuery();

                // Others +100
                var cmdOther = connection.CreateCommand();
                cmdOther.CommandText = @"UPDATE Employees SET Value = Value + 100 WHERE Name NOT LIKE 'E%' AND Name NOT LIKE 'G%'";
                cmdOther.ExecuteNonQuery();

                tx.Commit();
            }
            return NoContent();
        }

        public class AbcSumResult
        {
            public string Initial { get; set; }
            public long Sum { get; set; }
        }

        [HttpGet("abc-sums")]
        public ActionResult<List<AbcSumResult>> GetAbcSums()
        {
            var results = new List<AbcSumResult>();
            var connectionStringBuilder = new SqliteConnectionStringBuilder() { DataSource = "./SqliteDB.db" };
            using (var connection = new SqliteConnection(connectionStringBuilder.ConnectionString))
            {
                connection.Open();
                var cmd = connection.CreateCommand();
                cmd.CommandText = @"
                    SELECT SUBSTR(Name,1,1) AS Initial, SUM(Value) AS Total
                    FROM Employees
                    WHERE (Name LIKE 'A%' OR Name LIKE 'B%' OR Name LIKE 'C%')
                    GROUP BY SUBSTR(Name,1,1)
                    HAVING Total >= 11171
                    ORDER BY Initial";
                using var reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    results.Add(new AbcSumResult
                    {
                        Initial = reader.GetString(0),
                        Sum = reader.GetInt64(1)
                    });
                }
            }
            return results;
        }
    }
}
