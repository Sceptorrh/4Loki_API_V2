'use client';

import React, { useEffect, useState } from 'react';
import DateRangeSelector from '@/components/reports/DateRangeSelector';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

interface FinancialStats {
    period: string;
    total_appointments: number;
    total_revenue: number;
    average_price: number;
}

interface AppointmentStats {
    period: string;
    total_appointments: number;
    unique_dogs: number;
    unique_customers: number;
}

interface ServiceStats {
    service_type: string;
    total_count: number;
    total_revenue: number;
}

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [financialStats, setFinancialStats] = useState<FinancialStats[]>([]);
    const [appointmentStats, setAppointmentStats] = useState<AppointmentStats[]>([]);
    const [serviceStats, setServiceStats] = useState<ServiceStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!startDate || !endDate) return;

            try {
                setLoading(true);
                const [financialRes, appointmentRes, serviceRes] = await Promise.all([
                    fetch(`/api/reports?type=financial&period=${selectedPeriod}&startDate=${startDate}&endDate=${endDate}`),
                    fetch(`/api/reports?type=appointments&period=${selectedPeriod}&startDate=${startDate}&endDate=${endDate}`),
                    fetch(`/api/reports?type=services&startDate=${startDate}&endDate=${endDate}`),
                ]);

                const [financialData, appointmentData, serviceData] = await Promise.all([
                    financialRes.json(),
                    appointmentRes.json(),
                    serviceRes.json(),
                ]);

                setFinancialStats(financialData);
                setAppointmentStats(appointmentData);
                setServiceStats(serviceData);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedPeriod, startDate, endDate]);

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
    };

    const handleDateRangeChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Reports & Analytics</h1>
            
            <DateRangeSelector
                onPeriodChange={handlePeriodChange}
                onDateRangeChange={handleDateRangeChange}
                selectedPeriod={selectedPeriod}
                startDate={startDate}
                endDate={endDate}
            />

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Financial Overview */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Financial Overview</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={financialStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="total_revenue" stroke="#8884d8" name="Revenue" />
                                    <Line type="monotone" dataKey="average_price" stroke="#82ca9d" name="Average Price" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Appointment Statistics */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">Appointment Statistics</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={appointmentStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_appointments" fill="#8884d8" name="Total Appointments" />
                                    <Bar dataKey="unique_dogs" fill="#82ca9d" name="Unique Dogs" />
                                    <Bar dataKey="unique_customers" fill="#ffc658" name="Unique Customers" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Service Type Distribution */}
                    <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
                        <h2 className="text-xl font-semibold mb-4">Service Type Distribution</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviceStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="service_type" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_count" fill="#8884d8" name="Total Count" />
                                    <Bar dataKey="total_revenue" fill="#82ca9d" name="Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 