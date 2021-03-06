import React, { useContext } from "react"

import MaterialTable from "material-table"

import { createAuthenticatedClient } from "../../authentication"

import { AuthenticationContext } from "../../states"

import { Box, makeStyles } from "@material-ui/core"

import {
  listAllCourses,
  listClasses,
  searchClassInstructor,
  removeClass,
  updateClass,
  createClass,
  createClassUser
} from "./api"

import { useSnackbar } from "notistack"

import icons from "../../components/materialTable/icons"

const useStyles = makeStyles((theme) => ({
  classesTable: {
    padding: theme.spacing(2),
    "& > *": {
      border: "0px",
      boxShadow: "0px 0px"
    },
    background: theme.palette.background.default,
    border: `6px solid ${theme.palette.white}`
  }
}))

const ListClasses = ({ client, rowDataCourse }) => {
  const { authentication } = useContext(AuthenticationContext)

  const classes = useStyles()

  const { enqueueSnackbar } = useSnackbar()

  return (
    <Box className={classes.classesTable}>
      <MaterialTable
        title={`Turmas de ${rowDataCourse.title}`}
        icons={icons}
        data={async () => {
          let _listClassesRaw

          try {
            _listClassesRaw = await client.request(listClasses, {
              params: { courseId: rowDataCourse.id }
            })
          } catch (error) {
            console.log(error)

            _listClassesRaw = { listClasses: [] }
          }

          let _listClasses

          try {
            let classesInstructors = _listClassesRaw.listClasses.map(
              ({ instructor, ...rest }) => {
                return client.request(searchClassInstructor, {
                  id: instructor
                })
              }
            )

            classesInstructors = await Promise.all(classesInstructors)

            classesInstructors = classesInstructors.map((instructorData) => {
              return `${instructorData.searchUser.firstName} ${instructorData.searchUser.secondName}`
            })

            _listClasses = _listClassesRaw.listClasses.map(
              ({ instructor, ...rest }, index) => {
                return {
                  ...rest,
                  instructor: classesInstructors[index],
                  instructorId: instructor
                }
              }
            )
          } catch (error) {
            console.log(error)

            _listClasses = []
          }

          return new Promise((resolve, reject) => {
            return resolve({
              data: _listClasses,
              page: 0,
              totalCount: _listClasses.length
            })
          })
        }}
        columns={[
          {
            title: "Vagas",
            field: "vacancies",
            type: "numeric"
          },
          { title: "Sala", field: "room", type: "string" },
          { title: "Turno", field: "shift", type: "string" },
          {
            title: "Horário",
            field: "time",
            type: "time"
          },
          {
            title: "Professor",
            field: "instructor",
            type: "string",
            editable: "never"
          }
        ]}
        options={{
          actionsColumnIndex: -1,
          selection: false,
          search: false,
          // header: false,
          showTitle: true,
          toolbar: true,
          columnsButton: false,
          exportButton: true,
          paging: false,
          detailPanelColumnAlignment: "left"
        }}
        localization={{
          body: {
            addTooltip: "Adicionar",
            emptyDataSourceMessage: "Não há registros",
            filterRow: {
              filterTooltip: "Filtrar"
            },
            editTooltip: "Editar",
            deleteTooltip: "Excluir",
            editRow: {
              cancelTooltip: "Cancelar",
              saveTooltip: "Salvar",
              deleteText: "Tem certeza que deseja excluir?"
            }
          },
          header: {
            actions: "Ações",
            export: "Exportar"
          },
          toolbar: {
            exportTitle: "Exportar",
            exportName: "Exportar como CSV"
          }
        }}
        editable={{
          isEditable: (rowData) => {
            return (
              rowData.instructorId === rowDataCourse.creator ||
              rowData.instructorId === authentication.userId
            )
          },
          isDeletable: (rowData) => {
            return (
              rowData.instructorId === rowDataCourse.creator ||
              rowData.instructorId === authentication.userId
            )
          },
          onRowAdd: async (newData) => {
            let classCreated

            try {
              classCreated = await client.request(createClass, {
                params: {
                  ...newData,
                  vacancies: parseInt(newData.vacancies),
                  instructor: authentication.userId,
                  courseId: rowDataCourse.id,
                  time: `${newData.time.getHours()}:${newData.time.getMinutes()}`
                }
              })

              enqueueSnackbar("Turma criada", {
                variant: "success",
                autoHideDuration: 5000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            } catch (error) {
              console.log(error)

              enqueueSnackbar(
                "Erro ao criar turma, verifique se todos os campos estão preenchidos",
                {
                  variant: "error",
                  autoHideDuration: 8000,
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "right"
                  }
                }
              )
            }

            try {
              // eslint-disable-next-line
              const classUserCreated = await client.request(createClassUser, {
                classId: classCreated.createClass.id,
                userId: authentication.userId
              })

              enqueueSnackbar("Turma associada com aluno", {
                variant: "success",
                autoHideDuration: 5000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            } catch (error) {
              console.log(error)

              enqueueSnackbar("Erro ao associar turma ao aluno", {
                variant: "error",
                autoHideDuration: 8000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            }

            return new Promise((resolve, reject) => {
              resolve()
            })
          },
          onRowUpdate: async (newData, oldData) => {
            const changes = Object.keys(newData)
              .filter((key) => {
                return newData[key] !== oldData[key] ? key : null
              })
              .map((key) => {
                let cache = { [key]: newData[key] }

                if (["vacancies"].includes(key))
                  cache = { [key]: parseInt(newData[key]) }

                if (["time"].includes(key))
                  cache = {
                    [key]: `${newData.time.getHours()}:${newData.time.getMinutes()}`
                  }
                return cache
              })

            try {
              // eslint-disable-next-line
              const classUpdated = await client.request(updateClass, {
                params: Object.assign(...changes, { id: newData.id })
              })

              enqueueSnackbar("Turma atualizada", {
                variant: "success",
                autoHideDuration: 5000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            } catch (error) {
              console.log(error)

              enqueueSnackbar("Erro ao atualizar turma", {
                variant: "error",
                autoHideDuration: 8000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            }

            return new Promise((resolve, reject) => {
              resolve()
            })
          },
          onRowDelete: async (oldData) => {
            try {
              // eslint-disable-next-line
              const classRemoved = await client.request(removeClass, {
                id: oldData.id
              })

              enqueueSnackbar("Turma excluída", {
                variant: "success",
                autoHideDuration: 5000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            } catch (error) {
              console.log(error)

              enqueueSnackbar("Erro ao excluir turma", {
                variant: "error",
                autoHideDuration: 8000,
                anchorOrigin: {
                  vertical: "bottom",
                  horizontal: "right"
                }
              })
            }

            return new Promise((resolve, reject) => {
              resolve()
            })
          }
        }}
      />
    </Box>
  )
}

const ListCourses = ({ client }) => {
  return (
    <MaterialTable
      title="Cursos"
      icons={icons}
      data={async (query) => {
        let filters = query.filters.map((item) => {
          return {
            [item.column.field]: {
              type: item.column.type,
              value: item.value
            }
          }
        })

        filters = Object.assign(
          {
            private: {
              type: "boolean",
              value: "unchecked"
            }
          },
          ...filters
        )

        let courses

        try {
          courses = await client.request(listAllCourses, {
            private: filters.private.value === "checked" ? true : false
          })
        } catch (error) {
          console.log(error)

          courses = { listCourses: [] }
        }

        const coursesFiltered = courses.listCourses
          .filter((course) => {
            if (filters.title)
              return course.title
                .toLowerCase()
                .includes(filters.title.value.toLowerCase())

            return true
          })
          .filter((course) => {
            if (filters.start)
              return (
                new Date(course.start).toLocaleDateString() ===
                new Date(filters.start.value).toLocaleDateString()
              )

            return true
          })
          .filter((course) => {
            if (filters.end)
              return (
                new Date(course.end).toLocaleDateString() ===
                new Date(filters.end.value).toLocaleDateString()
              )

            return true
          })

        return new Promise((resolve, reject) => {
          resolve({
            data: coursesFiltered,
            page: 0,
            totalCount: coursesFiltered.length
          })
        })
      }}
      columns={[
        {
          title: "Nome",
          field: "title",
          type: "string",
          editable: "never"
        },
        {
          title: "Início",
          field: "start",
          type: "datetime",
          editable: "never"
        },
        { title: "Fim", field: "end", type: "datetime", editable: "never" },
        {
          title: "Privado",
          field: "private",
          type: "boolean",
          editable: "never"
        }
      ]}
      options={{
        actionsColumnIndex: -1,
        selection: false,
        search: false,
        exportButton: true,
        grouping: false,
        paging: false,
        filtering: true,
        debounceInterval: 50,
        detailPanelColumnAlignment: "left"
      }}
      localization={{
        body: {
          emptyDataSourceMessage: "Não há registros",
          filterRow: {
            filterTooltip: "Filtrar"
          },
          editTooltip: "Editar",
          deleteTooltip: "Excluir",
          editRow: {
            cancelTooltip: "Cancelar",
            saveTooltip: "Salvar",
            deleteText: "Tem certeza que deseja excluir?"
          }
        },
        header: {
          actions: "Ações",
          export: "Exportar"
        },
        toolbar: {
          exportTitle: "Exportar",
          exportName: "Exportar como CSV"
        }
      }}
      detailPanel={(rowData) => {
        return <ListClasses client={client} rowDataCourse={rowData} />
      }}
      onRowClick={(event, rowData, togglePanel) => togglePanel()}
    />
  )
}

const Classes = () => {
  const client = createAuthenticatedClient()

  return (
    <>
      <ListCourses client={client} />
    </>
  )
}

export default Classes
