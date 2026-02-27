export interface Mission {
    id: string;
    title: string;
    description: string;
    goalValue: number;
    currentValue: number;
    type: 'capture_area' | 'distance_run' | 'patterns';
    rewardXP: number;
    isCompleted: boolean;
}

export const generateDailyMissions = (): Mission[] => {
    return [
        {
            id: 'm1',
            title: 'Land Grab',
            description: 'Capture a total of 0.05 km²',
            goalValue: 50000, // sq meters
            currentValue: 0,
            type: 'capture_area',
            rewardXP: 500,
            isCompleted: false,
        },
        {
            id: 'm2',
            title: 'Marathon Lite',
            description: 'Run 2 kilometers in one session',
            goalValue: 2000, // meters
            currentValue: 0,
            type: 'distance_run',
            rewardXP: 300,
            isCompleted: false,
        },
        {
            id: 'm3',
            title: 'Geometrician',
            description: 'Complete 3 territory captures',
            goalValue: 3,
            currentValue: 0,
            type: 'patterns',
            rewardXP: 450,
            isCompleted: false,
        }
    ];
};
