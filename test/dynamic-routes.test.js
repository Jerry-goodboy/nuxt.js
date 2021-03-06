import test from 'ava'
import { resolve } from 'path'
import fs from 'fs'
import { Nuxt, Builder } from '..'
import { promisify } from 'util'
import { interceptLog } from './helpers/console'

const readFile = promisify(fs.readFile)

test.serial('Init Nuxt.js', async t => {
  const config = {
    rootDir: resolve(__dirname, 'fixtures/dynamic-routes'),
    dev: false,
    build: {
      stats: false
    }
  }

  const logSpy = await interceptLog(async () => {
    const nuxt = new Nuxt(config)
    await new Builder(nuxt).build()
  })
  t.true(logSpy.calledWithMatch('DONE'))
})

test('Check .nuxt/router.js', t => {
  return readFile(
    resolve(__dirname, './fixtures/dynamic-routes/.nuxt/router.js'),
    'utf-8'
  ).then(routerFile => {
    routerFile = routerFile
      .slice(routerFile.indexOf('routes: ['))
      .replace('routes: [', '[')
      .replace(/ _[0-9A-z]+,/g, ' "",')
    routerFile = routerFile.substr(
      routerFile.indexOf('['),
      routerFile.lastIndexOf(']') + 1
    )
    let routes = eval('( ' + routerFile + ')') // eslint-disable-line no-eval
    // pages/test/index.vue
    t.is(routes[0].path, '/test')
    t.is(routes[0].name, 'test')
    // pages/posts.vue
    t.is(routes[1].path, '/posts')
    t.is(routes[1].name, 'posts')
    t.is(routes[1].children.length, 1)
    // pages/posts/_id.vue
    t.is(routes[1].children[0].path, ':id?')
    t.is(routes[1].children[0].name, 'posts-id')
    // pages/parent.vue
    t.is(routes[2].path, '/parent')
    t.falsy(routes[2].name) // parent route has no name
    // pages/parent/*.vue
    t.is(routes[2].children.length, 3) // parent has 3 children
    t.deepEqual(routes[2].children.map(r => r.path), ['', 'teub', 'child'])
    t.deepEqual(routes[2].children.map(r => r.name), [
      'parent',
      'parent-teub',
      'parent-child'
    ])
    // pages/test/projects/index.vue
    t.is(routes[3].path, '/test/projects')
    t.is(routes[3].name, 'test-projects')
    // pages/test/users.vue
    t.is(routes[4].path, '/test/users')
    t.falsy(routes[4].name) // parent route has no name
    // pages/test/users/*.vue
    t.is(routes[4].children.length, 5) // parent has 5 children
    t.deepEqual(routes[4].children.map(r => r.path), [
      '',
      'projects',
      'projects/:category',
      ':id',
      ':index/teub'
    ])
    t.deepEqual(routes[4].children.map(r => r.name), [
      'test-users',
      'test-users-projects',
      'test-users-projects-category',
      'test-users-id',
      'test-users-index-teub'
    ])
    // pages/test/songs/toto.vue
    t.is(routes[5].path, '/test/songs/toto')
    t.is(routes[5].name, 'test-songs-toto')
    // pages/test/projects/_category.vue
    t.is(routes[6].path, '/test/projects/:category')
    t.is(routes[6].name, 'test-projects-category')
    // pages/test/songs/_id.vue
    t.is(routes[7].path, '/test/songs/:id?')
    t.is(routes[7].name, 'test-songs-id')
    // pages/users/_id.vue
    t.is(routes[8].path, '/users/:id?')
    t.is(routes[8].name, 'users-id')
    // pages/test/_.vue
    t.is(routes[9].path, '/test/*')
    t.is(routes[9].name, 'test-all')

    // pages/index.vue
    t.is(routes[10].path, '/')
    t.is(routes[10].name, 'index')

    // pages/_slug.vue
    t.is(routes[11].path, '/:slug')
    t.is(routes[11].name, 'slug')
    // pages/_key/_id.vue
    t.is(routes[12].path, '/:key/:id?')
    t.is(routes[12].name, 'key-id')
    // pages/_.vue
    t.is(routes[13].path, '/*/p/*')
    t.is(routes[13].name, 'all-p-all')
    // pages/_/_.vue
    t.is(routes[14].path, '/*/*')
    t.is(routes[14].name, 'all-all')
    // pages/_.vue
    t.is(routes[15].path, '/*')
    t.is(routes[15].name, 'all')
  })
})
