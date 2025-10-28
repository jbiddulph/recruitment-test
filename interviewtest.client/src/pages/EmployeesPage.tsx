import { useEffect, useState } from 'react';

type Employee = {
    name: string;
    value: number;
};

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState<string>("");
    const [value, setValue] = useState<number>(0);
    const [abcSums, setAbcSums] = useState<{ initial: string; sum: number }[] | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState<string>("");
    const [editValue, setEditValue] = useState<number>(0);

    useEffect(() => {
        let isMounted = true;
        const fetchEmployees = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('http://localhost:5039/api/Employees');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data: Employee[] = await response.json();
                if (isMounted) setEmployees(data);
            } catch (err) {
                if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchEmployees();
        return () => { isMounted = false; };
    }, []);

    async function fetchEmployees() {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5039/api/Employees');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data: Employee[] = await response.json();
            setEmployees(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load');
        } finally {
            setLoading(false);
        }
    }

    async function addEmployee() {
        setError(null);
        const resp = await fetch('http://localhost:5039/api/Employees', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Name: name, Value: value })
        });
        if (!resp.ok) { setError(`Add failed: HTTP ${resp.status}`); return; }
        setName(""); setValue(0);
        await fetchEmployees();
    }

    async function updateEmployee() {
        setError(null);
        const resp = await fetch('http://localhost:5039/api/Employees/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ OriginalName: name, NewName: name, Value: value })
        });
        if (!resp.ok) { setError(`Update failed: HTTP ${resp.status}`); return; }
        await fetchEmployees();
    }

    async function updateEmployeeInline(originalName: string, newName: string, newValue: number) {
        setError(null);
        const resp = await fetch('http://localhost:5039/api/Employees/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ OriginalName: originalName, NewName: newName, Value: newValue })
        });
        if (!resp.ok) { setError(`Update failed: HTTP ${resp.status}`); return; }
        setEditingId(null);
        await fetchEmployees();
    }

    function startEdit(employee: Employee) {
        setEditingId(employee.name);
        setEditName(employee.name);
        setEditValue(employee.value);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName("");
        setEditValue(0);
    }

    async function deleteEmployee(n: string) {
        setError(null);
        const resp = await fetch(`http://localhost:5039/api/Employees?name=${encodeURIComponent(n)}`, { method: 'DELETE' });
        if (!resp.ok) { setError(`Delete failed: HTTP ${resp.status}`); return; }
        await fetchEmployees();
    }

    async function runIncrementRule() {
        setError(null);
        const resp = await fetch('http://localhost:5039/api/Employees/increment-rule', { method: 'POST' });
        if (!resp.ok) { setError(`Rule failed: HTTP ${resp.status}`); return; }
        await fetchEmployees();
    }

    async function fetchAbcSums() {
        setError(null);
        const resp = await fetch('http://localhost:5039/api/Employees/abc-sums');
        if (!resp.ok) { setError(`Sums failed: HTTP ${resp.status}`); return; }
        const data = await resp.json();
        setAbcSums(data);
    }

    return (
        <>
            <h2>Employees</h2>
            <div style={{ marginBottom: 12 }}>
                <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
                <input type="number" placeholder="Value" value={value} onChange={e => setValue(Number(e.target.value))} style={{ marginLeft: 8 }} />
                <button onClick={addEmployee} style={{ marginLeft: 8 }}>Add</button>
                <button onClick={updateEmployee} style={{ marginLeft: 8 }}>Update</button>
                <button onClick={() => name && deleteEmployee(name)} style={{ marginLeft: 8 }}>Delete by name</button>
                <button onClick={runIncrementRule} style={{ marginLeft: 8 }}>Run Increment Rule</button>
                <button onClick={fetchAbcSums} style={{ marginLeft: 8 }}>Get ABC Sums</button>
            </div>
            {loading && <div>Loading…</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {!loading && !error && employees.length === 0 && (
                <div>No employees found.</div>
            )}
            {!loading && !error && employees.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Name</th>
                            <th style={{ textAlign: 'right' }}>Value</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((e, idx) => (
                            <tr key={`${e.name}-${idx}`}>
                                <td>
                                    {editingId === e.name ? (
                                        <input 
                                            value={editName} 
                                            onChange={ev => setEditName(ev.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    ) : (
                                        e.name
                                    )}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    {editingId === e.name ? (
                                        <input 
                                            type="number" 
                                            value={editValue} 
                                            onChange={ev => setEditValue(Number(ev.target.value))}
                                            style={{ width: '80px', textAlign: 'right' }}
                                        />
                                    ) : (
                                        e.value
                                    )}
                                </td>
                                <td>
                                    {editingId === e.name ? (
                                        <>
                                            <button onClick={() => updateEmployeeInline(e.name, editName, editValue)} style={{ marginRight: 4 }}>Save</button>
                                            <button onClick={cancelEdit}>Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(e)} style={{ marginRight: 4 }}>Edit</button>
                                            <button onClick={() => deleteEmployee(e.name)}>Delete</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {abcSums && (
                <div style={{ marginTop: 12 }}>
                    <h3>ABC Sums (\u2265 11171)</h3>
                    {abcSums.length === 0 ? (
                        <div>No qualifying sums.</div>
                    ) : (
                        <ul>
                            {abcSums.map((s, i) => (
                                <li key={`${s.initial}-${i}`}>{s.initial}: {s.sum}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </>
    );
}


