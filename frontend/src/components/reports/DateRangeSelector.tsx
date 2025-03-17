import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

interface DateRangeSelectorProps {
    onPeriodChange: (period: string) => void;
    onDateRangeChange: (startDate: string, endDate: string) => void;
    selectedPeriod: string;
    startDate: string;
    endDate: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
    onPeriodChange,
    onDateRangeChange,
    selectedPeriod,
    startDate,
    endDate,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    useEffect(() => {
        // Set initial date range to current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        onDateRangeChange(
            firstDayOfMonth.toISOString().split('T')[0],
            lastDayOfMonth.toISOString().split('T')[0]
        );
    }, []);

    const handleDateChange = (date: Date) => {
        setSelectedDate(date);
        setShowCalendar(false);

        let startDate: Date;
        let endDate: Date;

        switch (selectedPeriod) {
            case 'day':
                startDate = date;
                endDate = date;
                break;
            case 'week':
                startDate = new Date(date);
                startDate.setDate(date.getDate() - date.getDay());
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'month':
                startDate = new Date(date.getFullYear(), date.getMonth(), 1);
                endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                break;
            case 'year':
                startDate = new Date(date.getFullYear(), 0, 1);
                endDate = new Date(date.getFullYear(), 11, 31);
                break;
            default:
                startDate = date;
                endDate = date;
        }

        onDateRangeChange(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
    };

    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate);
        switch (selectedPeriod) {
            case 'day':
                newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'week':
                newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'month':
                newDate.setMonth(selectedDate.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'year':
                newDate.setFullYear(selectedDate.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }
        handleDateChange(newDate);
    };

    const formatDisplayDate = () => {
        switch (selectedPeriod) {
            case 'day':
                return selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
            case 'week':
                const weekStart = new Date(selectedDate);
                weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            case 'month':
                return selectedDate.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long' 
                });
            case 'year':
                return selectedDate.getFullYear().toString();
            default:
                return selectedDate.toLocaleDateString();
        }
    };

    return (
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 p-4 bg-white rounded-lg shadow">
            <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Period</label>
                <select
                    value={selectedPeriod}
                    onChange={(e) => onPeriodChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                </select>
            </div>
            <div className="flex-1 flex items-center justify-center space-x-4">
                <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                </button>
                <div className="relative">
                    <button
                        onClick={() => setShowCalendar(!showCalendar)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                        {formatDisplayDate()}
                    </button>
                    {showCalendar && (
                        <div className="absolute z-10 mt-1">
                            <DatePicker
                                selected={selectedDate}
                                onChange={handleDateChange}
                                inline
                                calendarClassName="rounded-lg shadow-lg"
                                maxDate={new Date()}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                            />
                        </div>
                    )}
                </div>
                <button
                    onClick={() => navigateDate('next')}
                    className="p-2 rounded-full hover:bg-gray-100"
                >
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                </button>
            </div>
        </div>
    );
};

export default DateRangeSelector; 