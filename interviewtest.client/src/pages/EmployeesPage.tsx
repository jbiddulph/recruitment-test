import { useEffect, useRef, useState } from 'react';

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

    const abcSumsRef = useRef<HTMLDivElement | null>(null);

    // Pagination state (10 per page)
    const PAGE_SIZE = 10;
    const [page, setPage] = useState<number>(1);
    const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(employees.length, startIndex + PAGE_SIZE);
    const paginatedEmployees = employees.slice(startIndex, endIndex);

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

    // Keep page within bounds when employees change
    useEffect(() => {
        const newTotalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
        if (page > newTotalPages) setPage(newTotalPages);
        if (page < 1) setPage(1);
    }, [employees, page]);

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
        const confirmed = window.confirm(`Delete employee "${n}"? This cannot be undone.`);
        if (!confirmed) return;
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
        // Ensure we have employees loaded
        let source = employees;
        if (source.length === 0) {
            try {
                const resp = await fetch('http://localhost:5039/api/Employees');
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                source = await resp.json();
                setEmployees(source);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to load');
                return;
            }
        }

        const initials = ['A','B','C'];
        const totals: Record<string, number> = {};
        for (const emp of source) {
            const initial = emp.name?.[0] ?? '';
            if (!initials.includes(initial)) continue;
            totals[initial] = (totals[initial] ?? 0) + Number(emp.value ?? 0);
        }
        const results = Object.entries(totals)
            .filter(([, sum]) => sum >= 11171)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([initial, sum]) => ({ initial, sum }));
        setAbcSums(results);
        // Bring the results into view so the user sees something happened
        setTimeout(() => {
            abcSumsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-4xl bg-white shadow-sm rounded-xl p-6 space-y-6">
                <h2 className="text-2xl font-semibold text-slate-800">Employees</h2>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    <input 
                        placeholder="Name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="flex-1 min-w-48 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input 
                        type="number" 
                        placeholder="Value" 
                        value={value} 
                        onChange={e => setValue(Number(e.target.value))}
                        className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button 
                        onClick={addEmployee}
                        disabled={!name}
                        className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                    <button 
                        onClick={runIncrementRule}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        Run Increment Rule
                    </button>
                    <button 
                        onClick={fetchAbcSums}
                        className="inline-flex items-center rounded-md bg-slate-700 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                        Get ABC Sums
                    </button>
                </div>

                {/* Status */}
                {loading && <div className="text-slate-600">Loading…</div>}
                {error && <div className="text-rose-600">Error: {error}</div>}

                {!loading && !error && employees.length === 0 && (
                    <div className="text-slate-600">No employees found.</div>
                )}

                {!loading && !error && employees.length > 0 && (
                    <div className="space-y-3">
                        {/* Pagination header */}
                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <div>
                                Showing <span className="font-medium text-slate-800">{startIndex + 1}</span>–<span className="font-medium text-slate-800">{endIndex}</span> of <span className="font-medium text-slate-800">{employees.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    Prev
                                </button>
                                <span className="text-slate-700">Page {page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full border-separate border-spacing-0">
                                <thead>
                                    <tr>
                                        <th className="text-left text-sm font-semibold text-slate-600 pb-2">Name</th>
                                        <th className="text-right text-sm font-semibold text-slate-600 pb-2">Value</th>
                                        <th className="w-40"></th>
                                    </tr>
                                </thead>
                                {/* Ensure dividers between rows */}
                                <tbody className="divide-y divide-slate-200">
                                    {paginatedEmployees.map((e, idx) => (
                                        <tr key={`${e.name}-${startIndex + idx}`}>
                                            <td className="py-2 pr-4">
                                                {editingId === e.name ? (
                                                    <input
                                                        value={editName}
                                                        onChange={ev => setEditName(ev.target.value)}
                                                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span className="text-slate-800">{e.name}</span>
                                                )}
                                            </td>
                                            <td className="py-2 pl-4 text-right align-middle">
                                                {editingId === e.name ? (
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={ev => setEditValue(Number(ev.target.value))}
                                                        className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-right text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                    />
                                                ) : (
                                                    <span className="text-slate-800">{e.value}</span>
                                                )}
                                            </td>
                                            <td className="py-2 pl-4">
                                                {editingId === e.name ? (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => updateEmployeeInline(e.name, editName, editValue)}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelEdit}
                                                            className="inline-flex items-center rounded-md bg-slate-200 px-3 py-2 text-slate-800 text-sm font-medium shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => startEdit(e)}
                                                            className="inline-flex items-center rounded-md bg-slate-700 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteEmployee(e.name)}
                                                            className="inline-flex items-center rounded-md bg-rose-600 px-3 py-2 text-white text-sm font-medium shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer (duplicate controls for convenience) */}
                        <div className="flex items-center justify-between text-sm text-slate-600">
                            <div>
                                Showing <span className="font-medium text-slate-800">{startIndex + 1}</span>–<span className="font-medium text-slate-800">{endIndex}</span> of <span className="font-medium text-slate-800">{employees.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    Prev
                                </button>
                                <span className="text-slate-700">Page {page} / {totalPages}</span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium border border-slate-300 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABC sums section (always render) */}
                <div ref={abcSumsRef} className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-800">ABC Sums (≥ 11171)</h3>
                    {abcSums === null && (
                        <div className="text-slate-600">Click "Get ABC Sums" to load results.</div>
                    )}
                    {abcSums !== null && (
                        abcSums.length === 0 ? (
                            <div className="text-slate-600">No qualifying sums.</div>
                        ) : (
                            <ul className="list-disc pl-5 text-slate-800">
                                {abcSums.map((s, i) => (
                                    <li key={`${s.initial}-${i}`}>{s.initial}: {s.sum}</li>
                                ))}
                            </ul>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}


