
class ParameterValidationKit {
  static isNaN(value) {
    const number = Number(value)
    return number !== value
  }

  static isFilledField(field) {
    const string = String(field)
    return string !== ''
  }

  static isString(value) {
    const string = String(value)
    return string === value
  }

  static isNumberString(value) {
    const number = Number(value)
    return String(number) === value
  }

  static isUndefined(value) {
    return value === undefined
  }

  static isDateString(value) {
    const { isNumberString } = ParameterValidationKit
    if (isNumberString(value)) return false
    return Boolean(Date.parse(value))
  }
}

exports = module.exports = {
  ParameterValidationKit
}
