RADIOCA.SE - a database for radiological cases

To make it work you'll need to edit the keys_file_example.js, add your twitter dev keys and rename the file to keys_file.js. It's important that the callback url for your application is correct, twitter doesn't accept localhost callbacks but you can map local.host to localhost and it'll work. 

You will also need a running instance of redis as a database backend. Redis will create a dump.rdb file in the directory in which is it started, so if you want persistency between sessions you'd better start redis from the same directory - at least it seems so to me.

Uploaded images will be saved to ./img so you'll need to create this directory as well.
