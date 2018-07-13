/* eslint object-shorthand: 0 */
/* eslint no-underscore-dangle: [2, { "allow": ["_id", "_doc"] }] */

const _ = require('lodash')
const mongoose = require('mongoose')
const Associations = require('./Associations')

const { ObjectId } = mongoose.Schema.Types

module.exports = class SchemaMixin {
  associate(as) {
    if (!this.associations) throw 'this schema does not have any associations'
    return this.associations.associate(as)
  }

  belongsTo(foreignModelName, options = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('belongsTo', _.merge({}, options, { foreignModelName }))

    this.defineBelongsToSchema(association, schemaOptions)
    this.defineBelongsToVirtual(association)
  }

  defineBelongsToSchema({ foreignModelName, localField }, schemaOptions) {
    function get() {
      const _id = this._doc[localField]
      if (!_id) return _id
      if (_id.constructor.name !== 'ObjectID') return _id._id
      return _id
    }
    _.merge(schemaOptions, {
      type: ObjectId,
      ref: foreignModelName,
      get
    })

    const schema = {}
    schema[localField] = schemaOptions
    this.add(schema)
  }

  defineBelongsToVirtual(association) {
    const { as, $as, localField, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, $as)) {
        const reference = this._doc[localField]
        // using native mongoose localField populate design for belongsTo
        if (!reference) return null
        if (reference.constructor instanceof association.foreignModel) {
          this[$as] = reference
        } else {
          this[$as] = await this[$fetch]()
        }
      }
      return this[$as]
    }).set(function set(value) {
      if (value instanceof association.foreignModel) this[$as] = value
      this[localField] = value
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[$as]
      return this
    }
  }

  polymorphic(foreignModelNames = [], options = {}, schemaOptions = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('polymorphic', _.merge({}, options, { foreignModelNames }))

    this.definePolymorphicSchema(association, schemaOptions)
    this.definePolymorphicVirtual(association)
  }

  definePolymorphicSchema({ foreignModelNames, localField, typeField }, schemaOptions) {
    _.merge(schemaOptions, { type: ObjectId })

    const schema = {}
    schema[localField] = schemaOptions
    schema[typeField] = {
      type: String,
      enum: foreignModelNames
    }
    this.add(schema)
  }

  definePolymorphicVirtual(association) {
    const { as, $as, localField, typeField, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!this._doc[localField]) return null
      if (!Object.prototype.hasOwnProperty.call(this, $as)) this[$as] = await this[$fetch]()
      return this[$as]
    }).set(function set(value) {
      this[typeField] = value.constructor.modelName
      this[localField] = value._id
      this[$as] = value
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[$as]
      return this
    }
  }

  hasOne(foreignModelName, options = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasOne', _.merge({}, options, { foreignModelName }))

    this.defineHasOneVirtual(association)
  }

  defineHasOneVirtual(association) {
    const { as, $as, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, $as)) this[$as] = await this[$fetch]()
      return this[$as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[$as]
      return this
    }
  }

  hasMany(foreignModelName, options = {}) {
    if (!this.associations) this.associations = new Associations(this)
    const association = this.associations.add('hasMany', _.merge({}, options, { foreignModelName }))

    this.defineHasManyVirtual(association)
  }

  defineHasManyVirtual(association) {
    const { as, $as, $fetch, $unset } = association
    this.virtual(as).get(async function get() {
      if (!Object.prototype.hasOwnProperty.call(this, $as)) this[$as] = await this[$fetch]()
      return this[$as]
    })

    this.methods[$fetch] = function fetch() {
      return association.findFor(this)
    }

    this.methods[$unset] = function unset() {
      delete this[$as]
      return this
    }
  }

  static apply(originalClass) {
    const mixinStaticMethods = Object.getOwnPropertyDescriptors(this.prototype)
    Object.keys(mixinStaticMethods).forEach(methodName => {
      if (methodName !== 'constructor') {
        const method = mixinStaticMethods[methodName]
        Object.defineProperty(originalClass.prototype, methodName, method)
      }
    })
  }
}
