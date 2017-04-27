angular.module('teams', [])
.controller('TeamsController', ['$q', '$scope', '$state', 'TeamService', 'UserService', 'ModalService', 'Notifications', 'Pagination',
function ($q, $scope, $state, TeamService, UserService, ModalService, Notifications, Pagination) {
  $scope.state = {
    userGroupGroupCreationError: '',
    selectedItemCount: 0,
    validName: false,
    pagination_count: Pagination.getPaginationCount('teams')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.formValues = {
    Name: '',
    Leaders: []
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('teams', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredTeams, function (team) {
      if (team.Checked !== allSelected) {
        team.Checked = allSelected;
        $scope.selectItem(team);
      }
    });
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.checkNameValidity = function() {
    var valid = true;
    for (var i = 0; i < $scope.teams.length; i++) {
      if ($scope.formValues.Name === $scope.teams[i].Name) {
        valid = false;
        break;
      }
    }
    $scope.state.validName = valid;
    $scope.state.teamCreationError = valid ? '' : 'Team name already existing';
  };

  $scope.addTeam = function() {
    $('#createTeamSpinner').show();
    $scope.state.teamCreationError = '';
    var teamName = $scope.formValues.Name;

    var leaders = [];
    var updateUserQueries = [];
    angular.forEach($scope.formValues.Leaders, function(user) {
      leaders.push(user.Id);
      if (user.RoleId !== 3) {
        updateUserQueries.push(UserService.updateUser(user.Id, undefined, 3));
      }
    });
    $q.all({
      team: TeamService.createTeam(teamName, leaders),
      users: updateUserQueries
    })
    .then(function success(data) {
      Notifications.success('Team successfully created', teamName);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create team');
    })
    .finally(function final() {
      $('#createTeamSpinner').hide();
    });
  };

  function deleteSelectedTeams() {
    $('#loadingViewSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadingViewSpinner').hide();
      }
    };
    angular.forEach($scope.teams, function (team) {
      if (team.Checked) {
        counter = counter + 1;
        TeamService.deleteTeam(team.Id)
        .then(function success(data) {
          var index = $scope.teams.indexOf(team);
          $scope.teams.splice(index, 1);
          Notifications.success('Team successfully deleted', team.Name);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove team');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  }

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to delete the selected team(s)? Users in the team(s) will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedTeams();
      }
    );
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      users: UserService.users(false),
      teams: TeamService.teams()
    })
    .then(function success(data) {
      $scope.teams = data.teams;
      $scope.users = data.users;
    })
    .catch(function error(err) {
      $scope.teams = [];
      $scope.users = [];
      Notifications.error('Failure', err, 'Unable to retrieve teams');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
