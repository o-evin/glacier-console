# AWS Glacier Console

AWS Glacier Console is a fast cross-platform Client for Amazon Glacier.

![Screenshot](../master/screenshot-vault.png)

## Features

    * Processes large files quickly using parallel multi-part uploads.
    * Ability to set a limit on the maximum multi-part process parallelization.
    * Support for multi-part downloads for fast and reliable data transfer.
    * Integrated requests queuing and throttling.
    * Ability to upload a Directory to Amazon Glacier.
    * Progress visualization.

![Screenshot](../master/screenshot-operations.png)

## Latest Releases

You can always build the latest version from the source code, otherwise take it here:

  * OS X (x64): glacier-darwin-x64.zip
  * Windows (x64): glacier-win32-x64.zip
  * Linux (x64) glacier-linux-x64.zip

  [Download] https://drive.google.com/drive/folders/0B0VszmdZGTGNVjRpV0lhcUdna0k?usp=sharing

## Installing
  ```
  $ git clone git://github.com/o-evin/glacier-console.git
  $ cd ./glacier-console
  $ npm install
  ```

## Run from the source code
  Install the project first and then run:
  ```
  $ npm start
  ```

## Building
  ```
  $ npm run build
  ```

## Packaging
  ```
  $ npm run pack
  ```
  After successful project Compilation and Packaging you should be able to find the apps under /bin folder.

### Packaging Windows app from non-Windows platforms
  On non-Windows host platforms, Wine 1.6 or later needs to be installed. On OS X, it is installable via [Homebrew](http://brew.sh/).

## Debugging
You can enable debugging output by setting the `DEBUG` environment variable:
  ```
  $ DEBUG=uploader,receiver npm start
  ```


## Authors

* **Oleksiy Evin** - *Initial work* - [o-evin](https://github.com/o-evin)

See also the list of [contributors](https://github.com/o-evin/glacier-console/contributors) who participated in this project.

## License

This project is licensed under the Apache-2.0 - see the [LICENSE.md](LICENSE.md) file for details

# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.
