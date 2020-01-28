elections20-primaries
======================================================

This news app is built on our `interactive template <https://github.com/nprapps/interactive-template>`_. Check the readme for that template for more details about the structure and mechanics of the app, as well as how to start your own project.

Getting started
---------------

To run this project you will need:

* Node installed (preferably with NVM or another version manager)
* The Grunt CLI (install globally with ``npm i -g grunt-cli``)
* Git

With those installed, you can then set the project up using your terminal:

#. Pull the code - ``git clone git@github.com:nprapps/elections20-primaries``
#. Enter the project folder - ``cd elections20-primaries``
#. Install dependencies from NPM - ``npm install``
#. Start the server - ``grunt``

Running tasks
-------------

Like all interactive-template projects, this application uses the Grunt task runner to handle various build steps and deployment processes. To see all tasks available, run ``grunt --help``. ``grunt`` by itself will run the "default" task, which processes data and starts the development server. However, you can also specify a list of steps as arguments to Grunt, and it will run those in sequence. For example, you can just update the JavaScript and CSS assets in the build folder by using ``grunt bundle less``.

Common tasks that you may want to run include:

* ``sheets`` - updates local data from Google Sheets
* ``docs`` - updates local data from Google Docs
* ``google-auth`` - authenticates your account against Google for private files
* ``static`` - rebuilds files but doesn't start the dev server
* ``cron`` - runs builds and deploys on a timer (see ``tasks/cron.js`` for details)
* ``publish`` - uploads files to the staging S3 bucket

  * ``publish:live`` uploads to production
  * ``publish:simulated`` does a dry run of uploaded files and their compressed sizes

This particular project includes some special tasks:

* ``elex`` - Loads data from the AP and outputs result JSON files into ``build/data``. You should have ``$AP_API_KEY`` set in your environment. This task has several command-line flags:

  * ``--date=M/D/YYYY`` - sets the date for which the rig should grab results. Defaults to the current date if not provided. It will pull anything within a day back of this date (meaning that by default it will grab today's and yesterday's races).
  * ``--test`` - request test numbers from the AP.
  * ``--offline`` - use cached data if we have it. Obviously, you need to run this against the API at least once before you can try this.
  * ``--archive`` - mark all exported results as non-live.

* ``ap`` - Run the elex task and its prerequisites together

To get started with Iowa data, run `grunt state json elex --date=02/3/2020`

There are also three tasks that are related to testing the app in "persistent" mode (i.e., running with regular updates and either displaying them locally or publishing them).

* ``local`` - Run the rig as a local preview server, without live reload, but with results pulled from AP every 15 seconds
* ``deploy`` - Run the rig as a deployment server, publishing new updates to staging S3
* ``deploy-live`` - Run the rig as a deployment server, publishing new updates to live S3

Data inputs
-----------

This app expects a number of sheets to exist with the following names:

* races - a calendar list of races and associated metadata or chatter
* mugs - candidate photos
* chatter - A sheet of text for the top of each state page
* calls - overrides for race results
* candidates - overrides for candidate data (name, party, etc)
* strings - application-wide text lookup

To call races, you should update the calls sheet with the AP id of the race
you want to call in the "key" column, and a comma-separated list of winner IDs
in the "winner" column. You can get the ID numbers for the races and
candidates from the AP feed (Elex is a good way to find these) or from the
data files the rig produces. If you want to un-call the race, set this to a
value that won't match any candidate, such as "false".

Deployment server
-----------------

We are currently deploying this on EC2 using SystemD to run it as a Linux
service. This means the server will restart it when it crashes, and provide a
standard mechanism for collecting/following log messages.

You can create the systemd unit file by running ``grunt systemd``. This file
includes instructions for installing and starting the service at the top. Once
the service is installed, you can use the ``systemctl`` command to check on it
and control its operation::

    sudo systemctl start primaries
    sudo systemctl stop primaries
    sudo systemctl status primaries

To update the code running on the server, SSH into the EC2 box, enter the
``elections20-primaries`` directory, and ``git pull`` to get the latest
source. To be safe, restart the server with ``sudo systemctl restart
primaries``--this will force the server to redeploy all resources (the
schedule deployments only run AP data processing, not front-end code).

Troubleshooting
---------------

**Fatal error: Port 35729 is already in use by another process.**

The live reload port is shared between this and other applications. If you're running another interactive-template project or Dailygraphics Next, they may collide. If that's the case, use ``--reload-port=XXXXX`` to set a different port for the live reload server. You can also specify a port for the webserver with ``--port=XXXX``, although the app will automatically find the first available port after 8000 for you.
