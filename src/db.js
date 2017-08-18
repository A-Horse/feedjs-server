let sqlite3 = require('sqlite3').verbose(),
  md5 = require('md5');

import R from 'ramda';
import path from 'path';

let db;

let rowId = {};

const knex = require('knex')({
  client: 'sqlite3',
  connection: { filename: path.join(process.env.HOME, 'feedjs-db') },
  useNullAsDefault: true // http://knexjs.org/#Builder-insert
});

export const atomTablePromise = knex.schema.createTableIfNotExists(
  'atom',
  function(table) {
    table.increments();
    table.string('identity');
    table.string('title');
    table.string('link');
    table.string('summary');
    table.string('content');
    table.string('published');
    table.string('updated');
    table.string('author');
    table.boolean('isRead');
    table.timestamps();
  }
);

export const createTablesIfNotExsits = async () => {
  return await Promise.all([atomTablePromise]).then();
};

export const insertToAtom = async data => {
  const exist = await knex('atom').where({ title: data.title });
  if (exist.length) {
    return Promise.resolve();
  }
  return knex('atom').insert({
    ...data,
    ...{ created_at: new Date().getTime() }
  });
};

export const makeAtomRead = id => {
  return knex('atom').where({ id }).update({
    isRead: true
  });
};

export const getAtoms = async number => {
  return knex('atom')
    .where({ isRead: null })
    .select('*')
    .limit(number)
    .orderBy('created_at', 'desc');
};

let getNewUnread = (number, cb) => {
  db.serialize(() => {
    db.all(
      `SELECT * from atom where has_read = "false" limit ${number};`,
      function(err, rows) {
        return cb(rows);
      }
    );
  });
};

let getNew = (number, cb) => {
  db.serialize(() => {
    db.all(`SELECT * from atom limit ${number};`, function(err, rows) {
      return cb(rows);
    });
  });
};

let getEntryByID = (id, cb) => {
  db.serialize(() => {
    db.get(`SELECT * from atom where id = "${id}";`, function(err, row) {
      return cb(row);
    });
  });
};

let setEntryRead = (id, cb) => {
  db.serialize(() => {
    db.run(`UPDATE atom set has_read = "true" where id = "${id}"`, function(
      err,
      row
    ) {
      if (err) {
        return false;
      } else {
        return true;
      }
    });
  });
};

let searchEntryByTitle = (str, limit, cb) => {
  db.serialize(() => {
    db.all(
      `SELECT * from atom where title like "%${str}%" limit ${limit || 30}`,
      function(err, rows) {
        return cb(rows);
      }
    );
  });
};

let getEntryByTags = (tags, limit, cb) => {
  let tagQueryStr = tags
    .map(function(tag) {
      return `tags.tag_name = "${tag}"`;
    })
    .join(' or ');
  db.serialize(() => {
    db.all(
      `SELECT * from atom, tags where ` +
        tagQueryStr +
        ` and tags.atom_id = atom.id limit ${limit || 30}`,
      function(err, rows) {
        console.log(err);
        console.log(rows);
      }
    );
  });
};

let deleteAllEntry = cb => {
  db.serialize(() => {
    db.run('DELETE FROM atom;', (err, res) => {
      if (err) {
        return cb(false);
      } else {
        return cb(true);
      }
    });
  });
};
