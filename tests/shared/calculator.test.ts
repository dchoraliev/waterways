import { Calculator } from './calculator';

describe('Calculator', () => {
  it('should add two positive numbers', () => {
    // Arrange
    const calculator = new Calculator();
    const a = 5;
    const b = 3;

    // Act
    const result = calculator.add(a, b);

    // Assert
    expect(result).toBe(8);
  });

  it('should multiply two positive numbers', () => {
    // Arrange
    const calculator = new Calculator();
    const a = 4;
    const b = 5;

    // Act
    const result = calculator.multiply(a, b);

    // Assert
    expect(result).toBe(20);
  });

  it('should handle multiplication by zero', () => {
    // Arrange
    const calculator = new Calculator();
    const a = 100;
    const b = 0;

    // Act
    const result = calculator.multiply(a, b);

    // Assert
    expect(result).toBe(0);
  });
});
