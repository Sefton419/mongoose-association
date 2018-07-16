require('test/specHelper')
const mongoose = require('mongoose')
const { assert } = require('chai')
const Collection = require('src/Collection')
const drop = require('test/helpers/drop')

const Car = mongoose.model('Car')
const Assembly = mongoose.model('Assembly')
const Part = mongoose.model('Part')
const Rating = mongoose.model('Rating')

describe('A collection of record that is affiliated with an specific has many association', () => {
  before(() => {
    return new Promise((resolve) => {
      drop(resolve)
    })
  })

  describe('#constructor()', () => {
    it('errors when creating a collection without an document', () => {
      assert.throw(() => {
        new Collection()
      }, 'missing document for associating collection')
    })
    it('errors when creating a collection without an association', async () => {
      const car = await new Car().save()
      assert.throw(() => {
        new Collection(car)
      }, 'missing association for creating collection')
    })
    it('can create new hasMany', async () => {
      const car = await new Car().save()
      const hasManyAssemblies = Car.associate('assemblies')
      const collection = new Collection(car, hasManyAssemblies)
      const assembly = await collection.create()
      assert.strictEqual(assembly.constructor, Assembly)
      assert.strictEqual(collection.length, 1)
      let assemblies = await car.fetch('assemblies')
      assert.strictEqual(assemblies.length, 1)
      const anotherAssembly = await new Assembly().save()
      await collection.push(anotherAssembly)
      assert.strictEqual(collection.length, 2)
      assemblies = await car.fetch('assemblies')
      assert.strictEqual(assemblies.length, 2)
      const anotherAssemblies = await Assembly.create([{}, {}])
      await collection.push(...anotherAssemblies)
      assert.strictEqual(collection.length, 4)
      assemblies = await car.fetch('assemblies')
      assert.strictEqual(assemblies.length, 4)
    })
    it('can create new hasMany through', async () => {
      const car = await new Car().save()
      const hasManyParts = Car.associate('parts')
      const collection = new Collection(car, hasManyParts)
      const part = await collection.create()
      assert.strictEqual(part.constructor, Part)
      assert.strictEqual(collection.length, 1)
      const parts = await car.fetch('parts')
      assert.strictEqual(parts.length, 1)
    })
  })

  describe('#create()', () => {
    it('create a single hasMany record', async () => {
      const car = await new Car().save()
      const hasManyAssemblies = Car.associate('assemblies')
      const collection = new Collection(car, hasManyAssemblies)
      const assembly = await collection.create()
      assert.strictEqual(assembly.constructor, Assembly)
      assert.strictEqual(collection.length, 1)
      const assemblies = await car.fetch('assemblies')
      assert.strictEqual(assemblies.length, 1)
    })

    it('create multiple hasMany records', async () => {
      const car = await new Car().save()
      const hasManyAssemblies = Car.associate('assemblies')
      const collection = new Collection(car, hasManyAssemblies)
      const assemblies = await collection.create([{}, {}, {}])
      assert.strictEqual(assemblies[0].constructor, Assembly)
      assert.strictEqual(collection.length, 3)
      const sameAssemblies = await car.fetch('assemblies')
      assert.strictEqual(sameAssemblies.length, 3)
    })

    it('create a single hasMany through record', async () => {
      const car = await new Car().save()
      const hasManyParts = Car.associate('parts')
      const collection = new Collection(car, hasManyParts)
      const part = await collection.create()
      assert.strictEqual(part.constructor, Part)
      assert.strictEqual(collection.length, 1)
      const parts = await car.fetch('parts')
      assert.strictEqual(parts.length, 1)
    })

    it('create multiple hasMany through records', async () => {
      const car = await new Car().save()
      const hasManyParts = Car.associate('parts')
      const collection = new Collection(car, hasManyParts)
      const parts = await collection.create([{}, {}, {}])
      assert.strictEqual(parts[0].constructor, Part)
      assert.strictEqual(collection.length, 3)
      const sameParts = await car.fetch('parts')
      assert.strictEqual(sameParts.length, 3)
    })
  })

  describe('#push()', () => {
    it('push a single hasMany record', async () => {
      const car = await new Car().save()
      const hasManyAssemblies = Car.associate('assemblies')
      const collection = new Collection(car, hasManyAssemblies)
      const assembly = await new Assembly().save()
      await collection.push(assembly)
      assert.strictEqual(collection.length, 1)
      const assemblies = await car.fetch('assemblies')
      assert.strictEqual(assemblies.length, 1)
    })

    it('push multiple hasMany records', async () => {
      const car = await new Car().save()
      const hasManyAssemblies = Car.associate('assemblies')
      const collection = new Collection(car, hasManyAssemblies)
      const assemblies = await Assembly.create([{}, {}, {}])
      await collection.push(...assemblies)
      assert.strictEqual(collection.length, 3)
      const sameAssemblies = await car.fetch('assemblies')
      assert.strictEqual(sameAssemblies.length, 3)
    })

    it('push a single hasMany through record', async () => {
      const car = await new Car().save()
      const hasManyParts = Car.associate('parts')
      const collection = new Collection(car, hasManyParts)
      const part = await new Part().save()
      await collection.push(part)
      assert.strictEqual(collection.length, 1)
      const parts = await car.fetch('parts')
      assert.strictEqual(parts.length, 1)
    })

    it('push multiple hasMany through records', async () => {
      const car = await new Car().save()
      const hasManyParts = Car.associate('parts')
      const collection = new Collection(car, hasManyParts)
      const parts = await Part.create([{}, {}, {}])
      await collection.push(...parts)
      assert.strictEqual(collection.length, 3)
      const sameParts = await car.fetch('parts')
      assert.strictEqual(sameParts.length, 3)
    })
  })

  describe('#virtual $as', async () => {
    const car = await new Car().save()
    const assembly = await car.$assemblies.create()
    const assemblies = await car.fetch('assemblies')
    assert.strictEqual(assemblies.length, 1)
  })
})