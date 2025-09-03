# React Hook Form Dummy Data Implementation Guide

This guide explains how to implement the "Fill Dummy Data" and "Clear All Data" functionality when creating new forms using React Hook Form.

## Overview

The dummy data functionality allows developers to quickly populate forms with realistic sample data for testing and development purposes. It uses a dual approach:
1. **React Hook Form's `reset()` method** - Updates existing form values
2. **Component re-mounting with `key` props** - Forces complete form re-initialization

## Files to Modify When Adding New Forms

### 1. Form Component File (e.g., `components/YourNewForm.tsx`)

#### Required Imports
```typescript
import { useForm, Controller } from 'react-hook-form'
import React from 'react'
```

#### Form Component Structure
```typescript
interface YourFormData {
  field1: string;
  field2: string;
  // ... other fields
}

interface YourFormProps {
  defaultValues?: YourFormData;
  onFormChange?: (data: YourFormData) => void;
}

const YourNewForm: React.FC<YourFormProps> = ({
  defaultValues = {
    field1: '',
    field2: '',
    // ... default values for all fields
  },
  onFormChange,
}) => {
  // ✅ REQUIRED: Add 'reset' to useForm destructuring
  const { control, watch, reset, formState: { errors } } = useForm<YourFormData>({
    defaultValues,
    mode: 'onChange'
  });

  const watchedValues = watch();

  // ✅ REQUIRED: Simple useEffect to call onFormChange when form values change
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);

  // Your form JSX here...
  return (
    <View>
      {/* Your form fields using Controller */}
    </View>
  );
};

export default YourNewForm;
```

### 2. Parent Component File (e.g., `app/(root)/(tabs)/assessment/add_assessment.tsx`)

#### Step 1: Add Initial State Constant
```typescript
const AddAssessment = () => {
  // ✅ ADD: Initial state constant for your new form
  const INITIAL_YOUR_FORM_DATA = {
    field1: '',
    field2: '',
    // ... all fields with empty/default values
  };

  // Existing constants...
  const INITIAL_OWNER_DATA = { /* ... */ };
  // ... other constants
```

#### Step 2: Add State Variable
```typescript
  // ✅ ADD: State variable for your new form
  const [yourFormData, setYourFormData] = useState(INITIAL_YOUR_FORM_DATA);

  // Existing state variables...
  const [ownerData, setOwnerData] = useState(INITIAL_OWNER_DATA);
  // ... other state variables
```

#### Step 3: Add Form Change Handler
```typescript
  // ✅ ADD: Form change handler
  const handleYourFormChange = (data: typeof yourFormData) => {
    setYourFormData(data);
  };

  // Existing handlers...
  const handleOwnerFormChange = (data: typeof ownerData) => {
    setOwnerData(data);
  };
  // ... other handlers
```

#### Step 4: Add Dummy Data to fillDummyData Function
```typescript
  const fillDummyData = () => {
    // Existing dummy data...
    const dummyOwnerData = { /* ... */ };
    // ... other dummy data objects

    // ✅ ADD: Dummy data for your new form
    const dummyYourFormData = {
      field1: 'Sample Value 1',
      field2: 'Sample Value 2',
      // ... realistic sample values for all fields
    };

    // Set all state at once
    setOwnerData(dummyOwnerData);
    // ... other setters

    // ✅ ADD: Set your form data
    setYourFormData(dummyYourFormData);

    // Force form re-render by changing key
    setFormKey(prev => prev + 1);

    Alert.alert('Success', 'All forms filled with dummy data!');
  };
```

#### Step 5: Add Clear Data to clearAllData Function
```typescript
  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all form data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            // Reset all forms to initial state using constants
            setOwnerData({ ...INITIAL_OWNER_DATA });
            // ... other resets

            // ✅ ADD: Reset your form data
            setYourFormData({ ...INITIAL_YOUR_FORM_DATA });

            // Force form re-render by changing key
            setFormKey(prev => prev + 1);

            Alert.alert('Success', 'All form data cleared!');
          }
        }
      ]
    );
  };
```

#### Step 6: Add Form Component to JSX
```typescript
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {/* Existing forms... */}
        <OwnerDetailsForm
          key={`owner-${formKey}`}
          defaultValues={ownerData}
          onFormChange={handleOwnerFormChange}
        />
        
        {/* ✅ ADD: Your new form component */}
        <YourNewForm
          key={`yourform-${formKey}`}
          defaultValues={yourFormData}
          onFormChange={handleYourFormChange}
        />

        {/* Submit Button */}
        <TouchableOpacity onPress={handleSubmit}>
          {/* Submit button JSX */}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
```

#### Step 7: Update Validation (Optional)
```typescript
  const validateForm = () => {
    // Existing validations...

    // ✅ ADD: Validation for your new form (if needed)
    if (!yourFormData.field1.trim()) {
      Alert.alert('Validation Error', 'Field 1 is required');
      return false;
    }

    return true;
  };
```

#### Step 8: Update Submit Handler (Optional)
```typescript
  const handleSubmit = () => {
    if (!validateForm()) return;

    const assessmentData = {
      ownerData,
      locationData,
      // ... other form data

      // ✅ ADD: Include your form data
      yourFormData,
      
      createdAt: new Date().toISOString(),
    };

    console.log('Assessment Data:', assessmentData);
    // ... rest of submit logic
  };
```

## Key Implementation Points

### ✅ Required for Dummy Data to Work:
1. **Form Component**: Must use simple `useEffect` to call `onFormChange` when values change
2. **Parent Component**: Must use unique `key` props that change with `formKey` to force re-mounting
3. **State Management**: Must use initial state constants for consistency
4. **Object References**: Must use spread operator `{ ...INITIAL_DATA }` when clearing
5. **Component Re-mounting**: Rely on `key` prop changes to completely re-initialize forms with new data

### ✅ Best Practices:
1. **Realistic Dummy Data**: Use realistic sample values that represent actual use cases
2. **Consistent Naming**: Follow the pattern `INITIAL_*_DATA`, `dummy*Data`, `handle*FormChange`
3. **Type Safety**: Use TypeScript interfaces for all form data structures
4. **Error Handling**: Include proper validation and error messages

### ✅ Common Pitfalls to Avoid:
1. **Missing `key` props**: Forms won't re-mount properly when dummy data is filled
2. **Object Reference Issues**: Use spread operator when setting state
3. **Inconsistent Initial State**: Use constants to ensure consistency between initial and clear states
4. **Complex Reset Logic**: Avoid using `reset()` method as it can cause infinite re-render loops
5. **Overcomplicating useEffect**: Keep form change callbacks simple and rely on component re-mounting

## Example: Adding a Simple Contact Form

### 1. Create `components/ContactForm.tsx`:
```typescript
import { View, Text, TextInput } from 'react-native'
import React from 'react'
import { useForm, Controller } from 'react-hook-form'

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
}

interface ContactFormProps {
  defaultValues?: ContactFormData;
  onFormChange?: (data: ContactFormData) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  defaultValues = {
    name: '',
    email: '',
    phone: '',
  },
  onFormChange,
}) => {
  const { control, watch, reset, formState: { errors } } = useForm<ContactFormData>({
    defaultValues,
    mode: 'onChange'
  });

  const watchedValues = watch();

  React.useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(watchedValues);
    }
  }, [watchedValues, onFormChange]);

  return (
    <View className="bg-white rounded-xl p-5 mb-6 shadow-sm">
      <Text className="text-lg font-rubik-bold text-black-300 mb-4">Contact Information</Text>
      
      <Controller
        control={control}
        name="name"
        rules={{ required: 'Name is required' }}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="Enter name"
            className="border rounded-lg px-4 py-3 text-base font-rubik text-black-300 bg-white h-12 mb-4"
          />
        )}
      />
      
      {/* Add other fields similarly */}
    </View>
  );
};

export default ContactForm;
```

### 2. Update Parent Component:
```typescript
// Add to constants
const INITIAL_CONTACT_DATA = {
  name: '',
  email: '',
  phone: '',
};

// Add to state
const [contactData, setContactData] = useState(INITIAL_CONTACT_DATA);

// Add handler
const handleContactFormChange = (data: typeof contactData) => {
  setContactData(data);
};

// Add to fillDummyData
const dummyContactData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+63 917 123 4567',
};
setContactData(dummyContactData);

// Add to clearAllData
setContactData({ ...INITIAL_CONTACT_DATA });

// Add to JSX
<ContactForm
  key={`contact-${formKey}`}
  defaultValues={contactData}
  onFormChange={handleContactFormChange}
/>
```

This pattern ensures that your new forms will work seamlessly with the dummy data functionality!