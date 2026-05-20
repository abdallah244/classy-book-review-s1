import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// Strong password validation
@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    return (
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar &&
      isLongEnough
    );
  }

  defaultMessage() {
    return 'Password must contain uppercase, lowercase, number, special character, and be at least 8 characters';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Egyptian phone number validation
@ValidatorConstraint({ async: false })
export class IsEgyptPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string) {
    if (!phone) return true; // Optional
    return /^(\+20|0)?1[0125][0-9]{8}$/.test(phone);
  }

  defaultMessage() {
    return 'Invalid phone number. Must be an Egyptian number';
  }
}

export function IsEgyptPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEgyptPhoneConstraint,
    });
  };
}

// ObjectId validation
@ValidatorConstraint({ async: false })
export class IsMongoIdConstraint implements ValidatorConstraintInterface {
  validate(id: string) {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  defaultMessage() {
    return 'Invalid ID';
  }
}

export function IsMongoObjectId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsMongoIdConstraint,
    });
  };
}

// No HTML validation
@ValidatorConstraint({ async: false })
export class NoHtmlConstraint implements ValidatorConstraintInterface {
  validate(text: string) {
    if (!text) return true;
    return !/<[^>]*>/g.test(text);
  }

  defaultMessage() {
    return 'Text must not contain HTML';
  }
}

export function NoHtml(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NoHtmlConstraint,
    });
  };
}

// Match with another field
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return value === relatedValue;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must match ${relatedPropertyName}`;
        },
      },
    });
  };
}
