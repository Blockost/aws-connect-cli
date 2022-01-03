# aws-connect-cli

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

## Table of contents
1. [Overview](#Overview)
2. [Prerequisites](#Prerequisites)
3. [Installation](#Installation)
4. [Configuration](#Configuration)
5. [Need help or want to contribute ?](#NeedHelp)
6. [Licence](#Licence)


## Overview

`aws-connect` is an executable for Linux systems relying on AWS CLI that provides a user-friendly, prompt-based interface to connect to AWS EC2 instances securely. Its goal is to eliminate user-managed (and often unsecured) SSH keys and IP-whitelisting done via EC2 Security Groups 🔒.


## Prerequisites

- Node v12+
- AWS CLI v2+
  - CLI should be configured properly using an AWS access key
  - Your IAM user should have rights to use [AWS EC2 Instance Connect](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/Connect-using-EC2-Instance-Connect.html) and [AWS Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html) to connect to EC2 instances

## Installation

### Via packaged executable

Each version [hosted on Github](https://github.com/Blockost/aws-connect-cli/releases) provides an executable. You only have to download it, `chmod +x` it and you're good to go 🚀!

### Via git clone

An alternative would be to clone this repository and build the executable locally from the sources. It's actually very fast and only takes a few seconds to build it:

```
$ git clone git@github.com:Blockost/aws-connect-cli.git
$ cd aws-connect-cli
$ npm install && npm run build
```

The executable will be created in the `dist/` folder. 

Additionally, you can create a wrapper script in your local bin folder `/usr/local/bin/` to run it from anywhere (and provide the necessary config file 🏄). It also simplifies greatly the update process since you will only have to `git pull` and run `build-dist.sh` again to use the latest version:
```bash
#!/bin/bash
set -e

WORKING_DIR=/home/ubuntu/aws-connect-cli

exec $WORKING_DIR/dist/aws-connect-cli -f $WORKING_DIR/config.yml "$@"

exit 0
```

## Configuration

Configuration is pretty straightforward and use a single `yaml` file. By default, it looks for a file called `config.yml` in the same directory as the executable but you can override this by using `-f` following by the path to your config file. 

You can find all configuration parameters in [this example](config.example.yml). It's highly recommended that you simply copy-paste this file and edit it to suit  your needs.

## <a name="NeedHelp"></a> Need help or want to contribute ?

Use `-h` flag to show help. If you find a problem or would like to contribute, feel free to create an issue on the [Github repository](https://github.com/Blockost/aws-connect-cli/issues).

Before contributing, please read the [code of conduct](CODE_OF_CONDUCT.md).

## Licence

MIT © [Simon Espigolé](https://github.com/Blockost)
