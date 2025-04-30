# TODO

- add idle alert to config

- change termination behaviour to try to wait for "send a message" but if it's gone over by a lot to just look for "Done!" 

- when the usage page errors need to handle it gracefully
- add semantic analysis of message before "send a message" to determine if it is appropriate to:
    - prompt cycle (if "I'm done, should i do next step?")
    - alert the user (if "I'm stuck please help")
    - alert the user (if "I'm totally done there are no steps left to do")