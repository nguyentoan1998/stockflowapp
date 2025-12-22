import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

/**
 * Form Input with icon and error handling
 */
export const FormInput = ({
  label,
  value,
  onChangeText,
  icon,
  error,
  errorMessage,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  placeholder,
  autoCapitalize = 'none',
  secureTextEntry = false,
  right,
  style,
  ...props
}) => (
  <>
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      style={[styles.input, style]}
      mode="outlined"
      disabled={disabled}
      error={error}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      placeholder={placeholder}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      left={icon ? <TextInput.Icon icon={icon} /> : null}
      right={right}
      {...props}
    />
    {error && errorMessage && (
      <Text style={styles.errorText}>{errorMessage}</Text>
    )}
  </>
);

/**
 * Row with two inputs side by side
 */
export const FormInputRow = ({ children, style }) => (
  <View style={[styles.inputRow, style]}>
    {children}
  </View>
);

/**
 * Half width input for use in FormInputRow
 */
export const HalfInput = ({ children, style }) => (
  <View style={[styles.halfWidth, style]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  halfWidth: {
    width: '48%',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
});
