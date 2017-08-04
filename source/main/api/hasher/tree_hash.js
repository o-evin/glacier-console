import fs from 'fs';
import crypto from 'crypto';
import {Size} from '../../../contracts/const';

const PART_SIZE = Size.BYTES_IN_MEGABYTE;

class Node {

  constructor({tree, parent, depth = 0, index = 0}) {

    this.tree = tree;
    this.index = index;
    this.depth = depth;
    this.parent = parent;
    this.checksum = null;

    if(depth < tree.depth) {
      this.children = new Array(2);

      this.children[0] = new Node({
        tree,
        parent: this,
        depth: depth + 1,
        index: index * 2,
      });

      this.children[1] = new Node({
        tree,
        parent: this,
        depth: depth + 1,
        index: index * 2 + 1,
      });
    }
  }

  set(partIndex, checksum) {
    this.children[partIndex].checksum = checksum;

    const [leftChild, rightChild] = this.children;

    if(leftChild.checksum && rightChild.checksum) {

      let digest = leftChild.checksum;

      if(rightChild.checksum.length > 0) {
        const buffer = Buffer.concat(this.children.map(
          item => item.checksum
        ));

        digest = crypto.createHash('sha256')
          .update(buffer)
          .digest();
      }

      if(this.parent) {
        this.parent.set(this.index % 2, digest);
      } else {
        this.tree.checksum = digest;
      }

      this.children = null;

    }
  }

}

class DigestTree {
  constructor(length) {
    this.length = length;
    this.pairsNumber = Math.ceil(length / 2);
    this.depth = Math.ceil(Math.log2(this.pairsNumber)) + 1;
    this.root = new Node({tree: this});

    const treeLength = Math.pow(2, this.depth);

    Array.apply(null, {length: treeLength - length}).map(
      (value, index) => this.update(length + index, Buffer.alloc(0))
    );

    this.checksum = null;
  }

  update(index, checksum, depth = this.depth) {
    const pairIndex = Math.floor(index / 2);
    const pairDepth = depth - 1;
    const node = this.traverse(this.root, pairIndex, pairDepth);
    const partIndex = index % 2;
    node.set(partIndex, checksum);
  }

  traverse(node, index, depth) {
    if(depth === 0) return node;
    const range = Math.pow(2, depth);
    const rightChild = ((index + 1) / range) > 0.5;
    const nextIndex = rightChild ? index - (range / 2) : index;
    return this.traverse(node.children[+rightChild], nextIndex, --depth);
  }
}

export default class TreeHash {

  static read(fd, index, tree) {
    return new Promise((resolve, reject)=> {

      let buffer = Buffer.alloc(PART_SIZE);
      const pos = index * PART_SIZE;

      fs.read(fd, buffer, 0, PART_SIZE, pos,
        (error, bytesRead, buffer) => {
          if(error) return reject(error);

          const hasher = crypto.createHash('sha256');

          const checksum = hasher.update(
            buffer.slice(0, bytesRead)
          ).digest();

          buffer = null;

          tree.update(index, checksum);

          resolve();
        });

    });
  }

  static from(source, pos, length) {
    if(Array.isArray(source)) {
      return TreeHash.fromArray(source);
    }

    if(source instanceof Buffer) {
      return TreeHash.fromBuffer(source);
    }

    return TreeHash.fromFile(source, pos, length);
  }

  static fromArray(data) {

    const tree = new DigestTree(data.length);
    data.forEach((value, index) =>
      tree.update(index, Buffer.from(value, 'hex'))
    );
    return tree.checksum && tree.checksum.toString('hex');
  }

  static fromBuffer(data) {
    const partsCount = Math.ceil(data.length / PART_SIZE);
    const tree = new DigestTree(partsCount);

    Array.apply(null, {length: partsCount}).map(
      (value, index) => {
        const pos = index * PART_SIZE;
        const bytesCount = Math.min(PART_SIZE, data.length - pos);
        const hasher = crypto.createHash('sha256');
        const checksum = hasher.update(
          data.slice(pos, pos + bytesCount)
        ).digest();
        tree.update(index, checksum);
      });

    return tree.checksum && tree.checksum.toString('hex');
  }

  static fromFile(filePath, pos, length) {

    if(length) {
      var partsCount = Math.ceil(length / PART_SIZE);
    } else {
      const stats = fs.statSync(filePath);
      partsCount = Math.ceil(stats.length / PART_SIZE);
    }

    const tree = new DigestTree(partsCount);

    const fd = fs.openSync(filePath, 'r');

    Array.apply(null, {length: partsCount}).map(
      (value, index) => {
        let buffer = Buffer.alloc(PART_SIZE);
        const pos = index * PART_SIZE;

        const bytesRead = fs.readSync(fd, buffer, 0, PART_SIZE, pos);

        const hasher = crypto.createHash('sha256');
        const checksum = hasher.update(
          buffer.slice(0, bytesRead)
        ).digest();

        buffer = null;

        tree.update(index, checksum);
      });

    return tree.checksum && tree.checksum.toString('hex');
  }

}
