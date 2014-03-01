{exec} = require 'child_process'

# ------------ helper ------------

runscript = (cmd, callback) ->
	child = exec cmd
	child.stdout.on 'data', (data) -> console.log data.trim()
	child.stderr.on 'data', (data) -> console.log data.trim()
	child.on 'exit', (status) ->
		callback?()

# ------------ subtasks ------------

build = (callback) ->
	cmd = "cat client/src/models/*.js " +
		"client/src/collections/*.js " +
		"client/src/views/*.js " +
		"client/src/main.js " +
		"> client/lib/client.js"
	runscript(cmd, callback)

runServer = (callback) ->
	cmd = "node server/server.js"
	runscript(cmd, callback)

# ------------ command line tasks ------------

# cake build
buildDescrip = 'concatenate client/src/* as client/lib/client.js'
task 'build', buildDescrip, (options) ->
	build ->
		console.log 'client.js built'

# cake try
task 'try', 'run server', (options) ->
	build ->
		console.log 'client.js built'
		runServer()

	

