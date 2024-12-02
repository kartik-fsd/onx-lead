import * as FileSystem from 'expo-file-system';
import { RegistrationData } from '@/types';

const FILE_PATH = FileSystem.documentDirectory + 'registration_data.json';

/**
 * Save Registration Data to Local File System
 * @param data - Partial RegistrationData to be saved
 * @returns {Promise<boolean>} - True if successful, False otherwise
 */
export const saveRegistrationData = async (data: Partial<RegistrationData>): Promise<boolean> => {
    try {
        // Check if file exists
        const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);
        let existingData: Partial<RegistrationData> = {};

        if (fileInfo.exists) {
            const fileContent = await FileSystem.readAsStringAsync(FILE_PATH);
            existingData = JSON.parse(fileContent);
        }

        // Merge existing data with new data
        const updatedData = { ...existingData, ...data };
        await FileSystem.writeAsStringAsync(FILE_PATH, JSON.stringify(updatedData));
        return true;
    } catch (error) {
        console.error('Error saving registration data to file:', error);
        return false;
    }
};

/**
 * Get Registration Data from Local File System
 * @returns {Promise<Partial<RegistrationData> | null>} - Registration Data or null if not found
 */
export const getRegistrationData = async (): Promise<Partial<RegistrationData> | null> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);

        if (fileInfo.exists) {
            const fileContent = await FileSystem.readAsStringAsync(FILE_PATH);
            return JSON.parse(fileContent);
        } else {
            console.warn('No registration data file found.');
            return null;
        }
    } catch (error) {
        console.error('Error reading registration data from file:', error);
        return null;
    }
};

/**
 * Clear the Registration Data from the Local File System
 * @returns {Promise<boolean>} - True if successful, False otherwise
 */
export const clearRegistrationData = async (): Promise<boolean> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(FILE_PATH);

        if (fileInfo.exists) {
            // Delete the file if it exists
            await FileSystem.deleteAsync(FILE_PATH);
            console.log('Registration data cleared.');
            return true;
        } else {
            console.warn('No registration data file to clear.');
            return false;
        }
    } catch (error) {
        console.error('Error clearing registration data from file:', error);
        return false;
    }
};
