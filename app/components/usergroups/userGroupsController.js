angular.module('usergroups', [])
.controller('UserGroupsController', ['$scope', '$state', 'UserGroupService', 'ModalService', 'Messages', 'Pagination',
function ($scope, $state, UserGroupService, ModalService, Messages, Pagination) {
  $scope.state = {
    userGroupGroupCreationError: '',
    selectedItemCount: 0,
    validName: false,
    pagination_count: Pagination.getPaginationCount('usergroups')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = false;

  $scope.formValues = {
    Name: ''
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItems = function (allSelected) {
    angular.forEach($scope.state.filteredUserGroups, function (userGroup) {
      if (userGroup.Checked !== allSelected) {
        userGroup.Checked = allSelected;
        $scope.selectItem(userGroup);
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
    for (var i = 0; i < $scope.userGroups.length; i++) {
      if ($scope.formValues.Name === $scope.userGroups[i].Name) {
        valid = false;
        break;
      }
    }
    $scope.state.validName = valid;
    $scope.state.userGroupCreationError = valid ? '' : 'Group name already existing';
  };

  $scope.addUserGroup = function() {
    $scope.state.userGroupCreationError = '';
    var userGroupname = $scope.formValues.Name;
  };

  function deleteSelectedUserGroups() {
    $('#loadUsersSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadUsersSpinner').hide();
      }
    };
    angular.forEach($scope.userGroups, function (userGroup) {
      if (userGroup.Checked) {
        counter = counter + 1;
        UserGroupService.deleteUserGroup(userGroup.Id)
        .then(function success(data) {
          var index = $scope.userGroups.indexOf(userGroup);
          $scope.userGroups.splice(index, 1);
          Messages.send('User successfully deleted', userGroup.Username);
        })
        .catch(function error(err) {
          Messages.error("Failure", err, 'Unable to remove userGroup');
        })
        .finally(function final() {
          complete();
        });
      }
    });
  }

  $scope.removeAction = function () {
    ModalService.confirmDeletion(
      'Do you want to delete the selected user group(s)? Users in the selected group(s) will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedUserGroups();
      }
    );
  };

  function initView() {
    $('#loadingViewSpinner').show();
    UserGroupService.userGroups()
    .then(function success(data) {
      $scope.userGroups = data;
    })
    .catch(function error(err) {
      Messages.error("Failure", err, 'Unable to retrieve user groups');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);