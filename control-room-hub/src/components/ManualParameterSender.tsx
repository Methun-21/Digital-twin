import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Initial data as provided by the user
const INITIAL_DATA = {
    "timestamp": 1770397819576,
    "machineId": "m1",
    "machineName": "M1-ALPHA",
    "rpm": 2535.02,
    "torque": 78.4,
    "loadWeight": 50,
    "motorTemp": 28.71,
    "windingTemp": 40.87,
    "bearingTemp": 25.02,
    "ambientTemp": 26.4,
    "vibrationX": 1.85,
    "vibrationY": 1.512,
    "vibrationZ": 1.174,
    "vibrationMagnitude": 2.662,
    "voltage": 395.22,
    "current": 37.65,
    "powerConsumption": 21.909,
    "powerFactor": 0.85,
    "harmonicDistortion": 2.22,
    "efficiency": 95,
    "operatingHours": 0,
    "startStopCycles": 1,
    "wearLevel": 0,
    "bearingWear": 0,
    "insulationResistance": 100,
    "humidity": 59.8,
    "isRunning": true
};

const ManualParameterSender = () => {
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked :
                type === 'number' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('/api/send_critical_data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: res.statusText }));
                throw new Error(errorData.detail || `Error: ${res.status} ${res.statusText}`);
            }

            const data = await res.json();
            setResponse(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-6">Send Machine Parameters</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(formData).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                            <Label htmlFor={key} className="capitalize">{key}</Label>
                            <Input
                                id={key}
                                name={key}
                                type={typeof value === 'boolean' ? 'checkbox' : typeof value === 'number' ? 'number' : 'text'}
                                checked={typeof value === 'boolean' ? (value as boolean) : undefined}
                                value={typeof value === 'boolean' ? undefined : (value as string | number)}
                                onChange={handleFormChange}
                                step={typeof value === 'number' ? "any" : undefined}
                                className={typeof value === 'boolean' ? "h-4 w-4" : ""}
                            />
                        </div>
                    ))}
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending Parameters...' : 'Send Parameters to ML API'}
                </Button>
            </form>

            {error && (
                <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Error Sending Data</AlertTitle>
                    <AlertDescription className="flex flex-col gap-2">
                        <span>{error}</span>
                        <div className="text-xs bg-red-900/10 p-2 rounded">
                            <strong>Troubleshooting:</strong>
                            <ul className="list-disc ml-4 mt-1">
                                <li>Ensure your local helper (ml-api-client) is running.</li>
                                <li>Ensure your friend's ML API (via ngrok) is active and accessible.</li>
                                <li>Check browser console for network errors.</li>
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {response && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h3 className="font-bold text-green-800 mb-2">Response from API:</h3>
                    <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[300px]">
                        {JSON.stringify(response, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default ManualParameterSender;
