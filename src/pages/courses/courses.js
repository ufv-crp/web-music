import React, { useContext, useState, useEffect } from "react"

import moment from "moment"

import { Formik, Form, ErrorMessage, Field } from "formik"

import * as Yup from "yup"

import { useSnackbar } from "notistack"

import clsx from "clsx"

import {
  Grid,
  Box,
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Collapse,
  InputAdornment,
  Tooltip,
  Fab,
  FormControlLabel,
  Checkbox,
  Paper,
  TextField as TextFieldMaterialUi,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress
} from "@material-ui/core"

import { TextField } from "formik-material-ui"

import {
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
  DeleteOutlineOutlined as DeleteIcon,
  EditOutlined as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  LockOpen as LockOpenIcon,
  Description as DescriptionIcon,
  PermIdentity as PermIdentityIcon
} from "@material-ui/icons"

import { createAuthenticatedClient } from "../../authentication"

import { AuthenticationContext } from "../../states"

import {
  listAllCourses,
  createCourse,
  searchCourseCreator,
  removeCourseById,
  updateCourseById,
  userCourse
} from "./api"

import useStyles from "./styles"

import localization from "moment/locale/pt-br"

const _listAllCourses = ({
  client,
  query,
  setCourses,
  privateCourses = false
}) => {
  client
    .request(query, { private: privateCourses })
    .then((response) => {
      setCourses(response.listCourses)
    })
    .catch((error) => {
      console.log(error.response)

      setCourses([])
    })
}

const ListCourses = ({
  classes,
  client,
  courses,
  setCourses,
  createCourseState,
  setCreateCourseState,
  privateCourses,
  setPrivateCourses,
  searchCourse,
  setSearchCourse,
  updateCourseState,
  setUpdateCourseState
}) => {
  return (
    <>
      <Box bgcolor="white" mb="25px" borderRadius="borderRadius" p="15px">
        <Grid container spacing={5} justify="space-evenly" alignItems="center">
          <Grid item lg={6} md={6} sm={6} xs={4}>
            <TextFieldMaterialUi
              id="searchInput"
              placeholder="Pesquisar"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              onChange={(event) => {
                setSearchCourse(event.target.value.toLowerCase())
              }}
            />
          </Grid>

          <Grid
            item
            lg={3}
            md={3}
            sm={3}
            xs={4}
            className={`${classes.toolbarItem} ${classes.alignLeft}`}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={privateCourses}
                  onChange={() => {
                    setPrivateCourses(!privateCourses)

                    !privateCourses
                      ? _listAllCourses({
                          client,
                          setCourses: setCourses,
                          query: listAllCourses,
                          privateCourses: true
                        })
                      : setCourses(
                          courses.filter((course) => {
                            return course.private === false ? course : null
                          })
                        )
                  }}
                />
              }
              label="Privado"
            />
          </Grid>

          <Grid
            item
            lg={2}
            md={2}
            sm={2}
            xs={3}
            className={`${classes.toolbarItem} ${classes.alignLeft}`}>
            <Tooltip
              title="Novo Curso"
              aria-label="add"
              onClick={() => setCreateCourseState(!createCourseState)}>
              <Fab color="primary" className={classes.addIconFab}>
                <AddIcon />
              </Fab>
            </Tooltip>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={4}>
        {(courses.length &&
          courses
            .filter((course) => {
              if (course.private && !privateCourses) return null

              if (searchCourse !== "") {
                if (
                  (course.title !== undefined &&
                    course.title.toLowerCase().includes(searchCourse)) ||
                  (course.description !== undefined &&
                    course.description.toLowerCase().includes(searchCourse))
                )
                  return course
                else return null
              }

              return course
            })
            .map((course, index) => {
              return (
                <CardCourse
                  course={course}
                  classes={classes}
                  client={client}
                  setCourses={setCourses}
                  key={course.id + index}
                  updateCourseState={updateCourseState}
                  setUpdateCourseState={setUpdateCourseState}
                />
              )
            })) || (
          <Grid item lg={3} md={6} sm={6} xs={12}>
            <Paper className={classes.notFoundCourses}>
              <Typography>Não há nenhum curso cadastrado</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </>
  )
}

const CardCourse = ({
  course,
  classes,
  client,
  setCourses,
  updateCourseState,
  setUpdateCourseState
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [expanded, setExpanded] = useState(false)

  const [dialogOpen, setDialogOpen] = useState(false)

  const [courseCreator, setCourseCreator] = useState({
    firstName: "",
    secondName: ""
  })

  // eslint-disable-next-line
  const [courseRemoved, setCourseRemoved] = useState(false)

  const handleDialogClick = () => {
    setDialogOpen(!dialogOpen)
  }

  const handleExpandClick = () => {
    setExpanded(!expanded)
  }

  const previewDescriptionWords = 12

  const descriptionSplitted = course.description
    .split(" ")
    .slice(0, previewDescriptionWords)
    .join(" ")

  const _courseCreator = ({ client, query, id, setCourseCreator }) => {
    client
      .request(query, { id })
      .then((response) => {
        setCourseCreator(response.searchUser)
      })
      .catch((error) => {
        console.log(error.response)
      })
  }

  const _removeCourse = ({
    client,
    query,
    id,
    setCourseRemoved,
    setCourses,
    listAllCourses,
    enqueueSnackbar,
    expanded
  }) => {
    client
      .request(query, { id })
      .then((response) => {
        enqueueSnackbar("Curso removido", {
          variant: "success",
          autoHideDuration: 5000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right"
          }
        })

        setCourseRemoved(true)

        _listAllCourses({
          client,
          setCourses,
          query: listAllCourses,
          privateCourses: true
        })
      })
      .catch((error) => {
        enqueueSnackbar("Erro ao remover curso", {
          variant: "error",
          autoHideDuration: 8000,
          anchorOrigin: {
            vertical: "bottom",
            horizontal: "right"
          }
        })

        console.log(error.response)

        setCourseRemoved(false)
      })

    setDialogOpen(!dialogOpen)
  }

  return (
    <Grid item lg={4} md={6} sm={12} xs={12} key={course.id} display="flex">
      <Card>
        <CardContent className={classes.cardContent}>
          <Typography color="textPrimary" gutterBottom>
            {course.title}
          </Typography>

          <Typography
            color="textSecondary"
            className={`${classes.date} ${classes.centerIconText}`}>
            <EventAvailableIcon className={classes.iconColor} />
            {moment(course.start).format("L hh:mm")}
            <EventBusyIcon className={classes.iconColor} />
            {moment(course.end).format("L hh:mm")}
          </Typography>

          <Typography
            color="textSecondary"
            className={`${classes.marginSvgIcon} ${classes.centerIconText}`}>
            <LockOpenIcon className={classes.iconColor} />{" "}
            {(course.private && "Privado") || "Público"}
          </Typography>

          <Typography variant="h5" component="h2" color="textSecondary">
            {descriptionSplitted}
          </Typography>
        </CardContent>

        <CardActions>
          <Tooltip title={(expanded && "Ocultar") || "Detalhes"}>
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: expanded
              })}
              onClick={() => {
                _courseCreator({
                  client,
                  query: searchCourseCreator,
                  id: course.creator,
                  setCourseCreator
                })

                handleExpandClick()
              }}
              aria-expanded={expanded}
              aria-label="Show more">
              <ExpandMoreIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Atualizar">
            <IconButton
              className={classes.updateIcon}
              onClick={() =>
                setUpdateCourseState({
                  state: !updateCourseState.state,
                  course
                })
              }>
              <EditIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Excluir">
            <IconButton
              className={classes.deleteIcon}
              onClick={handleDialogClick}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>

          <Dialog
            open={dialogOpen}
            onClose={handleDialogClick}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description">
            <DialogTitle id="alert-dialog-title">{`Remover Curso`}</DialogTitle>

            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                Tem certeza que deseja remover este curso?
              </DialogContentText>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={handleDialogClick}
                className={classes.removeCourseDisagree}>
                Cancelar
              </Button>

              <Button
                onClick={() => {
                  _removeCourse({
                    client,
                    query: removeCourseById,
                    id: course.id,
                    setCourseRemoved,
                    setCourses,
                    listAllCourses,
                    enqueueSnackbar,
                    expanded
                  })
                }}
                className={classes.removeCourseAgree}
                autoFocus>
                Remover
              </Button>
            </DialogActions>
          </Dialog>
        </CardActions>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent className={classes.cardContent}>
            <Typography
              className={`${classes.marginSvgIcon} ${classes.centerIconText}`}
              color="textSecondary">
              <PermIdentityIcon className={classes.iconColor} />
              {`${courseCreator.firstName || ""} ${
                courseCreator.secondName || ""
              }`}
            </Typography>

            <Typography
              className={`${classes.marginSvgIcon} ${classes.centerIconText}`}
              color="textSecondary">
              <DescriptionIcon className={classes.iconColor} />
              Descrição
            </Typography>

            {course.description
              .split(/(\r\n|\n|\r)/gm)
              .map((paragraph, index) => (
                <Typography key={index} paragraph color="textSecondary">
                  {paragraph}
                </Typography>
              ))}
          </CardContent>
        </Collapse>
      </Card>
    </Grid>
  )
}

const CreateCourse = ({
  classes,
  client,
  setCreateCourseState,
  setCourses,
  createCourse,
  createCourseState,
  authentication
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [privateCourse, setPrivateCourse] = useState(false)

  const handlePrivateCourse = () => {
    setPrivateCourse(!privateCourse)
  }

  return (
    <Box
      p={5}
      bgcolor="white"
      borderRadius="borderRadius"
      className={classes.boxCreateCourse}>
      <Grid container spacing={4}>
        <Grid item lg={12} md={12} sm={12} xs={12} className={classes.backItem}>
          <IconButton
            aria-label="delete"
            onClick={() => {
              _listAllCourses({
                client,
                setCourses: setCourses,
                query: listAllCourses,
                privateCourses: false
              })
              setCreateCourseState(!createCourseState)
            }}>
            <ArrowBackIcon />
          </IconButton>

          <Typography className={classes.backItemText}>
            Cadastrar Curso
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={4} direction="column">
        <Grid item lg={12} md={12} sm={12} xs={12}>
          <Formik
            initialValues={{
              title: "",
              description: "",
              start: "",
              end: "",
              private: privateCourse
            }}
            onSubmit={async (values, actions) => {
              actions.setSubmitting(true)

              let responseCourse = {}

              try {
                responseCourse = await client.request(createCourse, {
                  params: {
                    ...values,
                    private: privateCourse,
                    creator: authentication.userId,
                    start: new Date(values.start).toISOString(),
                    end: new Date(values.end).toISOString()
                  }
                })

                enqueueSnackbar("Curso cadastrado", {
                  variant: "success",
                  autoHideDuration: 5000,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right"
                  }
                })

                actions.resetForm()
              } catch (error) {
                enqueueSnackbar("Erro ao cadastrar curso", {
                  variant: "error",
                  autoHideDuration: 8000,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right"
                  }
                })

                console.log("error", error.response)
              }

              // eslint-disable-next-line
              let responseUserCourse = {}

              try {
                responseUserCourse = await client.request(userCourse, {
                  courseId: responseCourse.createCourse.id,
                  userId: authentication.userId
                })

                enqueueSnackbar("Curso associado ao usuário", {
                  variant: "success",
                  autoHideDuration: 5000,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right"
                  }
                })
              } catch (error) {
                enqueueSnackbar("Erro ao associar curso ao usuário", {
                  variant: "error",
                  autoHideDuration: 8000,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right"
                  }
                })

                console.log("error", error.response)
              }

              actions.setSubmitting(false)
            }}
            validationSchema={Yup.object().shape({
              title: Yup.string()
                .min(10, "Mínimo 10 caracteres")
                .required("Título é obrigatório"),
              description: Yup.string()
                .min(30, "Mínimo 30 caracteres")
                .required("Descrição é obrigatória"),
              start: Yup.date().required("Data de início é obrigatória"),
              end: Yup.date().required("Data de término é obrigatória"),
              private: Yup.bool().oneOf([true, false], "Valor Inválido")
            })}>
            {(formik) => (
              <Form>
                <Grid container spacing={4} direction="column">
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="title"
                      type="text"
                      label="Título"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="description"
                      type="textarea"
                      label="Descrição"
                      variant="outlined"
                      multiline
                      rows="4"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="start"
                      type="datetime-local"
                      label="Data de início"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="end"
                      type="datetime-local"
                      label="Data de término"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <Box className={classes.checkedBox}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privateCourse}
                            onChange={handlePrivateCourse}
                            value={privateCourse}
                          />
                        }
                        label="Privado"
                      />

                      <span className={classes.checkedError}>
                        <ErrorMessage name="private" />
                      </span>
                    </Box>
                  </Grid>

                  {formik.isSubmitting && (
                    <LinearProgress className={classes.linearProgress} />
                  )}

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <Button variant="outlined" color="primary" type="submit">
                      Cadastrar
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Grid>
      </Grid>
    </Box>
  )
}

const UpdateCourse = ({
  classes,
  setCourses,
  updateCourseState,
  setUpdateCourseState,
  updateCourseById,
  client,
  authentication
}) => {
  const { enqueueSnackbar } = useSnackbar()

  const [privateCourse, setPrivateCourse] = useState(
    updateCourseState.course.private
  )

  const handlePrivateCourse = () => {
    setPrivateCourse(!privateCourse)
  }

  return (
    <Box
      p={5}
      bgcolor="white"
      borderRadius="borderRadius"
      className={classes.boxCreateCourse}>
      <Grid container spacing={4}>
        <Grid item lg={12} md={12} sm={12} xs={12} className={classes.backItem}>
          <IconButton
            aria-label="delete"
            onClick={() => {
              _listAllCourses({
                client,
                setCourses: setCourses,
                query: listAllCourses,
                privateCourses: false
              })
              setUpdateCourseState({
                state: !updateCourseState.state,
                course: {}
              })
            }}>
            <ArrowBackIcon />
          </IconButton>

          <Typography className={classes.backItemText}>
            Atualizar Curso
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={4} direction="column">
        <Grid item lg={12} md={12} sm={12} xs={12}>
          <Formik
            enableReinitialize={true}
            initialValues={{
              title: updateCourseState.course.title,
              description: updateCourseState.course.description,
              start: moment(updateCourseState.course.start).format(
                "YYYY-MM-DDThh:mm"
              ),
              end: moment(updateCourseState.course.end).format(
                "YYYY-MM-DDThh:mm"
              ),
              private: privateCourse
            }}
            onSubmit={(values, actions) => {
              actions.setSubmitting(true)

              client
                .request(updateCourseById, {
                  params: {
                    ...values,
                    id: updateCourseState.course.id,
                    start: new Date(values.start).toISOString(),
                    end: new Date(values.end).toISOString()
                  }
                })
                .then(() => {
                  enqueueSnackbar("Curso atualizado", {
                    variant: "success",
                    autoHideDuration: 5000,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "right"
                    }
                  })
                })
                .catch(() => {
                  enqueueSnackbar("Erro ao atualizar curso", {
                    variant: "error",
                    autoHideDuration: 8000,
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "right"
                    }
                  })
                })

              actions.setSubmitting(false)
            }}
            validationSchema={Yup.object().shape({
              title: Yup.string()
                .min(10, "Mínimo 10 caracteres")
                .required("Título é obrigatório"),
              description: Yup.string()
                .min(30, "Mínimo 30 caracteres")
                .required("Descrição é obrigatória"),
              start: Yup.date().required("Data de início é obrigatória"),
              end: Yup.date().required("Data de término é obrigatória"),
              private: Yup.bool().oneOf([true, false], "Valor inválido")
            })}>
            {(formik) => (
              <Form>
                <Grid container spacing={4} direction="column">
                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="title"
                      type="text"
                      label="Título"
                      variant="outlined"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="description"
                      type="textarea"
                      label="Descrição"
                      variant="outlined"
                      multiline
                      rows="4"
                      fullWidth
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="start"
                      type="datetime-local"
                      label="Data de início"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={12} md={12} lg={12}>
                    <Field
                      component={TextField}
                      name="end"
                      type="datetime-local"
                      label="Data de término"
                      variant="outlined"
                      fullWidth
                      InputLabelProps={{
                        shrink: true
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <Box className={classes.checkedBox}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={privateCourse}
                            onChange={handlePrivateCourse}
                            value={privateCourse}
                          />
                        }
                        label="Privado"
                      />

                      <span className={classes.checkedError}>
                        <ErrorMessage name="private" />
                      </span>
                    </Box>
                  </Grid>

                  {formik.isSubmitting && (
                    <LinearProgress className={classes.linearProgress} />
                  )}

                  <Grid item xs={12} sm={4} md={4} lg={4}>
                    <Button variant="outlined" color="primary" type="submit">
                      Enviar
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </Grid>
      </Grid>
    </Box>
  )
}

const Courses = () => {
  const classes = useStyles()

  const { authentication } = useContext(AuthenticationContext)

  const client = createAuthenticatedClient()

  const [courses, setCourses] = useState([])

  const [privateCourses, setPrivateCourses] = useState(false)

  const [createCourseState, setCreateCourseState] = useState(false)

  const [updateCourseState, setUpdateCourseState] = useState({
    state: false,
    course: {}
  })

  const [searchCourse, setSearchCourse] = useState("")

  moment.locale("pt-br", localization)

  useEffect(() => {
    _listAllCourses({
      client,
      setCourses,
      query: listAllCourses,
      privateCourses
    })

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box>
      {!createCourseState && !updateCourseState.state && (
        <ListCourses
          classes={classes}
          client={client}
          courses={courses}
          setCourses={setCourses}
          createCourseState={createCourseState}
          setCreateCourseState={setCreateCourseState}
          privateCourses={privateCourses}
          setPrivateCourses={setPrivateCourses}
          searchCourse={searchCourse}
          setSearchCourse={setSearchCourse}
          updateCourseState={updateCourseState}
          setUpdateCourseState={setUpdateCourseState}
        />
      )}

      {createCourseState && (
        <CreateCourse
          classes={classes}
          setCourses={setCourses}
          createCourseState={createCourseState}
          setCreateCourseState={setCreateCourseState}
          createCourse={createCourse}
          client={client}
          authentication={authentication}
        />
      )}

      {updateCourseState.state && (
        <UpdateCourse
          classes={classes}
          setCourses={setCourses}
          updateCourseState={updateCourseState}
          setUpdateCourseState={setUpdateCourseState}
          updateCourseById={updateCourseById}
          client={client}
          authentication={authentication}
        />
      )}
    </Box>
  )
}

export default Courses
